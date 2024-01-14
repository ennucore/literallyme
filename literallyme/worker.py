import os
import traceback
import asyncio

os.environ['worker'] = '1'

from bot import bot
from db import StickerPack
from utils import upload_file, process_sticker
from concurrent.futures import ProcessPoolExecutor

from swapper.swap import fully_process_video

sticker_paths = ['stickers/0/homelander.webm', 'stickers/0/popcorn.webm', 'stickers/0/5278314910416117820.webm',
                 'stickers/0/5278314910416117820.webm', 'stickers/0/5278314910416117820.webm',
                 'stickers/0/5278314910416117820.webm']


async def get_videos(bot, pack: StickerPack) -> list[(int, int, bytes)]:
    with open(pack.pack_id + '.png', 'wb') as f:
        f.write(pack.input_photo)
    docs = list()
    # for sticker in sticker_paths:
    #     file_path = process_sticker(fully_process_video(pack.pack_id + '.png', sticker))
    #     docs.append(await upload_file(bot, file_path))
    with ProcessPoolExecutor(max_workers=4) as pool:
        loop = asyncio.get_event_loop()
        futures = [
            loop.run_in_executor(
                pool,
                fully_process_video,
                pack.pack_id + '.png',
                sticker
            )
            for sticker in sticker_paths
        ]
        for result in await asyncio.gather(*futures):
            file_path = process_sticker(result)
            docs.append(await upload_file(bot, file_path))
    return docs


async def process_a_random_pack():
    pack = StickerPack.random_queued_pack()
    if pack is None:
        return
    print('Processing a pack')
    pack.processing()
    docs = await get_videos(bot, pack)
    pack.add_docs(docs)


async def main():
    await bot.connect()
    while True:
        try:
            await process_a_random_pack()
        except Exception:
            print(traceback.format_exc())
        await asyncio.sleep(1)


bot.loop.run_until_complete(main())
