import os
import traceback
import asyncio

os.environ['worker'] = '1'

from bot import bot
from db import StickerPack
from utils import upload_file, process_sticker, lock_file, get_username
from concurrent.futures import ProcessPoolExecutor

from swapper.swap import fully_process_video

sticker_paths = ['stickers/0/popcorn.webm', 
                 # 'stickers/0/homelander.webm',
                 # 'stickers/0/5278314910416117820.webm',
                 # 'stickers/0/016_kissing_face_with_closed_eyes.webm', 
                 'stickers/0/5460885659407357966.webm',
                 'stickers/0/008_thumbs_up.webm', 'stickers/0/cena.webm',
                 'stickers/0/homelander2.webm', 'stickers/0/idk.webm',
                 'stickers/0/margo.webm', 'stickers/0/ponasenkov.webm', 'stickers/0/rock.webm',
                 'stickers/0/gachi.webm', 
                 #'stickers/0/saul.webm', 
                 'stickers/0/kiss.webm',
                 'stickers/0/taking_photo.webm', 
                 #'stickers/0/looking.webm', 
                 'stickers/0/dancing.webm',
                 'stickers/0/homelander_blood.webm',
                 # 'stickers/0/007_face_with_symbols_on_mouth.webm', 'stickers/0/003_slightly_smiling_face.webm'
                 ]


async def get_videos(bot, pack: StickerPack, delete: bool = False) -> list[(int, int, bytes)]:
    with open(pack.pack_id + '.png', 'wb') as f:
        f.write(pack.input_photo)
    docs = list()
    paths = list()
    for sticker in sticker_paths:
        path = fully_process_video(pack.pack_id + '.png', sticker)
        paths.append(path)

    with ProcessPoolExecutor(max_workers=4) as pool:
        loop = asyncio.get_event_loop()
        futures = [
            loop.run_in_executor(
                pool,
                process_sticker,
                path
            )
            for path in paths
        ]
        for result in await asyncio.gather(*futures):
            try:
                docs.append(await upload_file(bot, result))
            except:
                print(traceback.format_exc())
                docs.append((0, 0, b''))
            try:
                if delete:
                    os.remove(result)
            except:
                print(traceback.format_exc())

    return docs


async def process_a_random_pack():
    pack = await StickerPack.random_queued_or_old_processing_pack()
    if pack is None:
        return
    print('Processing a pack')
    await pack.processing()
    docs = await get_videos(bot, pack)
    await pack.add_docs(docs)


async def main():
    await bot.connect()
    while True:
        try:
            await process_a_random_pack()
        except Exception:
            print(traceback.format_exc())
        await asyncio.sleep(1)


lock_file('locks/' + get_username() + '.lock')
bot.loop.run_until_complete(main())
