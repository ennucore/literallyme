import os
import asyncio
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from dotenv import load_dotenv
import time
import db
from charts import get_charts, get_stats

# Load environment variables from .env file
load_dotenv()
bot_token = os.getenv('BOT_TOKEN')

# Initialize bot and dispatcher
bot = Bot(token=bot_token)
dp = Dispatcher()


@dp.message(Command("start"))
async def start_handler(message: types.Message):
    """Send a welcome message when the user starts the bot"""
    lang = ['en', 'ru'][message.from_user.language_code == 'ru']
    await message.answer(
        ['Hi! Send me a photo of a person and I will create a sticker pack with that person for you.',
         'Привет! Пришли мне фото и я создам для тебя стикерпак буквально с тобой (или человеком с картинки).'][
            lang == 'ru'])
    await db.User.from_mongo(message.from_user.id, create_if_not_exists=True, lang=lang)

@dp.message(F.photo)
async def photo_handler(message: types.Message):
    """Handle photo messages"""
    user = await db.User.from_mongo(message.from_user.id, 
                                  lang=['en', 'ru'][message.from_user.language_code == 'ru'])
    
    print(f'Received a photo from {message.from_user.id}')
    # Download photo sent by the user
    file = await bot.get_file(message.photo[-1].file_id)
    photo_data = await bot.download_file(file.file_path)
    print(f'Downloaded the photo from {message.from_user.id}')
    
    if message.caption and 'stars' in message.caption.lower():
        pack = await user.new_pack(photo_data.read(), custom_status='awaiting_payment')
        print(f'Created a new pack {pack.pack_id} in the db for {message.from_user.id}')
        
        # Create invoice for 100 stars
        prices = [types.LabeledPrice(label='Premium Pack', amount=100)] # 145 is 1 star in smallest units
        
        await bot.send_invoice(
            message.chat.id,
            title=['Sticker Pack', 'Премиум Стикерпак'][user.lang == 'ru'],
            description=['Get your sticker pack for 100 stars!', 
                        'Получи свой стикерпак за 100 звёзд!'][user.lang == 'ru'],
            payload=pack.pack_id,
            currency='XTR',
            prices=prices,
            provider_token=""
        )
    else:
        pack = await user.new_pack(photo_data.read())
        await message.answer([
            'Creating your pack, please, be patient, as this can take a lot of time - you\'re in a queue. ',
            'Создаю твой стикерпак. Это может занять некоторое время, потому что нейронки долго делают бжжж. '
        ][user.lang == 'ru'])

@dp.pre_checkout_query()
async def process_pre_checkout_query(pre_checkout_query: types.PreCheckoutQuery):
    print(f'Received a pre-checkout query! payload: {pre_checkout_query.invoice_payload}')
    user_id = pre_checkout_query.from_user.id
    payload = pre_checkout_query.invoice_payload

    if not payload.startswith("literally"):
        # Handle top-up request
        import aiohttp
        import os

        payments_hook_url = 'https://us-central1-literallyme-dev.cloudfunctions.net/tg-receipt-hook-function'
        topup_token = os.getenv('TOPUP_TOKEN')
        
        payload_data = {
            "customer_user_id": user_id,
            "top_up_count": pre_checkout_query.total_amount,
            "transaction_id": str(pre_checkout_query.id)  # Using pre_checkout_query id as transaction_id
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                payments_hook_url,
                json=payload_data,
                headers={"Authorization": f"Bearer {topup_token}"}
            ) as response:
                print('Top up response:', await response.json())
    else:
        # Original sticker pack logic
        pack = await db.StickerPack.from_mongo(payload)
        print(f'Received the pack {payload} from mongo for the pre-checkout query {pre_checkout_query.id}')
        pack.stages_timestamps["paid"] = int(time.time())
        await pack.set_status('queued')
        print(f'Set the status to queued, answering the pre-checkout query now')
    
    await bot.answer_pre_checkout_query(pre_checkout_query.id, ok=True)


@dp.message(Command("fancy_charts"))
async def send_stats(message: types.Message):
    if message.from_user.username != 'ennucore':
        return
        
    charts = await get_charts(db.mongo)
    for chart in charts:
        await message.answer_photo(photo=chart, caption='Chart')

@dp.message(Command("all_stats"))
async def send_text_stats(message: types.Message):
    if message.from_user.username != 'ennucore':
        return
        
    stats = await get_stats(db.mongo)
    await message.answer(stats)

async def main():
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())