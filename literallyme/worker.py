import os
import time
import traceback
import asyncio
import sys
import pynvml
import os

os.environ['worker'] = '1'

from bot import bot
from db import StickerPack
from utils import upload_file, process_sticker, lock_file, get_username
from concurrent.futures import ProcessPoolExecutor
from rich import print

from swapper.swap import fully_process_video

sticker_paths = ['stickers/0/popcorn.webm', 
                 # 'stickers/0/homelander.webm',
                 # 'stickers/0/5278314910416117820.webm',
                 # 'stickers/0/016_kissing_face_with_closed_eyes.webm', 
                 'stickers/0/5460885659407357966.webm',
                 'stickers/0/008_thumbs_up.webm', 'stickers/0/cena.webm',
                 'stickers/0/homelander2.webm', #'stickers/0/idk.webm',
                 'stickers/0/margo.webm', 'stickers/0/ponasenkov.webm', 'stickers/0/rock.webm',
                 #'stickers/0/gachi.webm', <- doesn't work for some reason, should fix
                 #'stickers/0/saul.webm', 
                 #'stickers/0/kiss.webm', <- doesn't work for some reason, should fix
                 'stickers/0/taking_photo.webm', 
                 #'stickers/0/looking.webm',
                 'stickers/0/dancing.webm',
                 'stickers/0/homelander_blood.webm',
                 # 'stickers/0/007_face_with_symbols_on_mouth.webm', 'stickers/0/003_slightly_smiling_face.webm'
                 ]    


WORKER_MEM = 7.9
pynvml.nvmlInit()
handle = pynvml.nvmlDeviceGetHandleByIndex(0)
mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
memory_gb = mem_info.total / (1024 ** 3)
n_workers = os.getenv('N_WORKERS') or int(memory_gb // WORKER_MEM)
print(f"We'll use {n_workers} workers, since the total memory is {memory_gb} GB")
machine_info = {
    'memory_gb': memory_gb,
    'n_workers': n_workers,
    'gpu': pynvml.nvmlDeviceGetName(handle),
    'username': get_username(),
    'worker_name': os.getenv('worker_name')
}
print(machine_info)
pynvml.nvmlShutdown()


def get_n_workers():
    return n_workers


async def get_videos(bot, pack: StickerPack, delete: bool = False) -> list[(int, int, bytes)]:
    with open('photos/' + pack.pack_id + '.png', 'wb') as f:
        f.write(pack.input_photo)
    docs = list()
    paths = list()
    # for sticker in sticker_paths:
    #     print(f'Processing sticker {sticker}')
    #     paths.append(fully_process_video('photos/' + pack.pack_id + '.png', sticker))
    #     print(f'Done: {paths[-1]}')

    print(f'[blue]Processing pack {pack.pack_id}: running fully_process_video for the stickers with {get_n_workers()} workers[/blue]')

    with ProcessPoolExecutor(max_workers=get_n_workers()) as pool:
        loop = asyncio.get_event_loop()
        futures = [
            loop.run_in_executor(
                pool,
                fully_process_video,
                'photos/' + pack.pack_id + '.png', sticker
            )
            for sticker in sticker_paths
        ]
        for result in await asyncio.gather(*futures):
            paths.append(result)
    print(f'[blue]Processing pack {pack.pack_id}: created the videos[/blue]')
    print('\n'.join(paths))

    # with ProcessPoolExecutor(max_workers=4) as pool:
    #     loop = asyncio.get_event_loop()
    #     futures = [
    #         loop.run_in_executor(
    #             pool,
    #             process_sticker,
    #             path
    #         )
    #         for path in paths
    #     ]
    #     for result in await asyncio.gather(*futures):
    #         try:
    #             docs.append(await upload_file(bot, result))
    #         except:
    #             print(traceback.format_exc())
    #             docs.append((0, 0, b''))
    #         try:
    #             if delete:
    #                 os.remove(result)
    #         except:
    #             print(traceback.format_exc())
    print(f'[blue]Processing pack {pack.pack_id}: uploading the videos[/blue]')
    errors = []
    for i, path in enumerate(paths):
        try:
            docs.append(await upload_file(bot, path))
        except:
            print(f'[red]Error uploading file {path} for pack {pack.pack_id}[/red]')
            print(traceback.format_exc())
            docs.append((0, 0, b''))
            errors.append(i)
        try:
            if delete:
                os.remove(path)
        except:
            print(traceback.format_exc())
    print(f'[blue]Processing pack {pack.pack_id}: uploading done[/blue]')
    print(f'[red]{len(errors)} errors: {errors}[/red]')
    return docs


async def process_a_pack(pack_id=None):
    if not pack_id:
        pack = await StickerPack.random_queued_or_old_processing_pack()
    else:
        pack = await StickerPack.from_mongo(pack_id)
    if pack is None:
        return
    print(f'[bold][red]Processing pack {pack.pack_id}[/red][/bold]')
    start_time = time.time()
    await pack.processing()
    docs = await get_videos(bot, pack)
    print(f'[blue][bold]Pack {pack.pack_id} processed in {time.time() - start_time:.2f} seconds[/bold][/blue]')
    await pack.add_docs(docs, worker_info={**machine_info, 'start_time': start_time, 'duration': time.time() - start_time})


async def process_packs(pack_ids: list | str):
    if isinstance(pack_ids, str):
        pack_ids = pack_ids.split(',')
    for pack_id in pack_ids:
        await process_a_pack(pack_id)


async def main():
    await bot.connect()
    while True:
        try:
            await process_a_pack()
        except Exception:
            print(traceback.format_exc())
        await asyncio.sleep(1)


if sys.argv[-1].startswith('id:'):
    bot.loop.run_until_complete(process_a_pack(sys.argv[-1][3:]))
elif sys.argv[-1].startswith('ids:'):
    bot.loop.run_until_complete(process_packs(sys.argv[-1][4:]))
elif sys.argv[-1] == '1':
    bot.loop.run_until_complete(process_a_pack())
else:
    lock_file('locks/' + get_username() + '.lock')
    bot.loop.run_until_complete(main())
