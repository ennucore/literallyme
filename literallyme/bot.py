import os
from telethon import TelegramClient
from dotenv import load_dotenv
import random

# Load environment variables from .env file
load_dotenv()
api_id = int(os.getenv('TG_API_ID'))
api_hash = os.getenv('TG_API_HASH')
bot_token = os.getenv('BOT_TOKEN')

# Initialize the bot client
bot = (TelegramClient('bot' if not os.getenv('worker') else f'worker-{random.randint(0, 1000000)}', api_id, api_hash)
       .start(bot_token=bot_token))

