import asyncio
import traceback
from telethon import events, TelegramClient
from pack_creation import create_sticker_pack, documents_from_directory
import db
from charts import get_charts, get_stats
import time


async def get_videos(bot, pack) -> list[(id, id, bytes)]:
    # Implement your video generation logic here and return the directory containing the videos
    # Placeholder for the directory path containing generated videos
    directory = 'out'
    return await documents_from_directory(bot, directory)


async def generate_videos(bot, pack: db.StickerPack) -> db.StickerPack:
    await pack.processing()
    docs = await get_videos(bot, pack)
    await pack.add_docs(docs)
    return pack


async def wait_for_video_generation(pack: db.StickerPack) -> db.StickerPack:
    while pack.status != 'generated':
        pack = await db.StickerPack.from_mongo(pack.pack_id)
        await asyncio.sleep(2)
    return pack


async def create_pack(bot, pack: db.StickerPack):
    tg_pack = await create_sticker_pack(bot, pack.user_id, pack.documents, name_suffix=pack.pack_id)
    pack.status = 'created'
    pack.stages_timestamps['created'] = int(time.time())
    await pack.save_to_mongo()
    return tg_pack


async def finish_pack(bot, user, pack: db.StickerPack):
    try:
        first_sticker = (await create_pack(bot, pack)).documents[0]
    except Exception:
        print(traceback.format_exc())
        await pack.set_status('failed')
        return

    await bot.send_message(user.user_id, ['This is literally you (or the person from the picture):',
                                           'Это буквально ты (или человек с картинки):'][user.lang == 'ru'])
    await bot.send_file(user.user_id, first_sticker)
    await bot.send_message(user.user_id, [
        'My friend told me that it might not be obvious that the bot generates an entire stickerpack and that you can '
        'click on the sticker to add the pack, but I believe in you\nBy the way, you can get stats for you sticker pack by going to @Stickers and clicking /packstats\n\nAlso, subscribe to @levchizhov',
        'Мой дружочек сказал мне, что может быть неочевидно, что можно нажать на стикер и добавить себе целый пак, '
        'но это же не так, правда?\nКстати, если зайти в @Stickers и нажать /packstats, то можно получить статистику по стикерпаку\n\nА еще подпишись на @levchizhov',
    ][user.lang == 'ru'])


async def finish_pack_by_id(bot, pack_id: str):
    print('Finishing pack by id', pack_id)
    pack = await db.StickerPack.from_mongo(pack_id)
    print('Pack found', pack)
    user = await db.User.from_mongo(pack.user_id)
    print('User found', user)
    await finish_pack(bot, user, pack)


async def finish_packs(bot: TelegramClient):
    while True:
        pack = await db.StickerPack.random_generated_pack()
        if pack is None:
            await asyncio.sleep(1)
            continue
        user = await db.User.from_mongo(pack.user_id)
        await finish_pack(bot, user, pack)


def apply_handlers(bot: TelegramClient):
    @bot.on(events.NewMessage(pattern='/start'))
    async def start(event):
        """Send a welcome message when the user starts the bot"""
        lang = ['en', 'ru'][event.sender.lang_code == 'ru']
        await event.respond(
            ['Hi! Send me a photo of a person and I will create a sticker pack with that person for you.',
             'Привет! Пришли мне фото и я создам для тебя стикерпак буквально с тобой (или человеком с картинки).'][
                lang == 'ru'])
        await db.User.from_mongo(event.sender_id, create_if_not_exists=True, lang=lang)

    @bot.on(events.NewMessage(func=lambda e: e.photo))
    async def photo_handler(event):
        """Handle photo messages"""
        # Download photo sent by the user to the "photos" folder
        user = await db.User.from_mongo(event.sender_id, lang=['en', 'ru'][event.sender.lang_code == 'ru'])
        photo_path = await event.message.download_media('photos/')
        with open(photo_path, 'rb') as file:
            photo = file.read()
        pack = await user.new_pack(photo)
        await bot.send_message(event.sender_id, [
            'Creating your pack, please, be patient, as this can take a lot of time - you\'re in a queue. ',
            # 'You can subscribe to @levchizhov while you wait to read walls of text from the creator of this bot',
            'Создаю твой стикерпак. Это может занять некоторое время, потому что нейронки долго делают бжжж. '
            # 'Пока ждешь, подпишись на @levchizhov, чтобы почитать стены текста от создателя этого бота'
        ][user.lang == 'ru'])

        # pack = await wait_for_video_generation(pack)
        # first_sticker = (await create_pack(bot, pack)).documents[0]
        #
        # await bot.send_message(event.sender_id, ['This is literally you:', 'Это буквально ты:'][user.lang == 'ru'])
        # await bot.send_file(event.sender_id, first_sticker)

    @bot.on(events.NewMessage(pattern='/fancy_charts', func=lambda e: e.sender.username in ('ennucore',)))
    async def send_stats(event):
        charts = await get_charts(db.mongo)
        for chart in charts:
            await bot.send_file(event.sender, chart, force_document=False, caption='Chart')

    @bot.on(events.NewMessage(pattern='/all_stats', func=lambda e: e.sender.username in ('ennucore',)))
    async def send_text_stats(event):
        stats = await get_stats(db.mongo)
        await bot.send_message(event.sender, stats)
