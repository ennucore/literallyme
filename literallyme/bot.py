import os
from telethon import TelegramClient
from dotenv import load_dotenv
from handlers import apply_handlers

# Load environment variables from .env file
load_dotenv()
api_id = int(os.getenv('TG_API_ID'))
api_hash = os.getenv('TG_API_HASH')
bot_token = os.getenv('BOT_TOKEN')

# Initialize the bot client
bot = TelegramClient('bot' if not os.getenv('worker') else 'worker', api_id, api_hash).start(bot_token=bot_token)
apply_handlers(bot)

