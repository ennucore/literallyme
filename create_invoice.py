import asyncio
from aiogram import Bot
from aiogram.types import LabeledPrice

# Replace with your bot token and payment provider token
BOT_TOKEN = "6335219014:AAF5mUDclsYZyBX-spDQkqwzWCHlmwXox9o"

# Invoice details
TITLE = "Training a Model"
DESCRIPTION = "Train a model with you, literally"
CURRENCY = "USD"  # Currency for Telegram Stars
PRICE = 500  # 500 Telegram Stars

async def generate_invoice_link():
    bot = Bot(token=BOT_TOKEN)
    try:
        # Create invoice price list
        prices = [LabeledPrice(label="500", amount=PRICE)]
        
        # Generate invoice link using `create_invoice`
        invoice_link = await bot.create_invoice_link(
            title=TITLE,
            description=DESCRIPTION,
            payload="stars_training_model",  # Unique payload for tracking
            currency='XTR',
            prices=prices
        )
        print("Invoice Link:", invoice_link)
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(generate_invoice_link())
