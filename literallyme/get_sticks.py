
import asyncio
import os
from telethon import TelegramClient

# Reading from environment variables
api_id = os.getenv('TG_API_ID')
api_hash = os.getenv('TG_API_HASH')

# User or bot to get stickers from
username = 'mb_aas'

async def main():
    # Create the client and connect
    client = TelegramClient('session', api_id, api_hash)
    await client.start()

    # Get the last 20 messages from the dialogue with the specified user
    messages = await client.get_messages(username, limit=20)

    # Loop through messages and download stickers
    for message in messages:
        if message.sticker:  # Check if the message contains a sticker
            # Create a directory with the name of the user if it doesn't exist
            directory_name = f"stickers_from_{username}"
            os.makedirs(directory_name, exist_ok=True)
            
            # Define file path and download sticker
            file_path = os.path.join(directory_name, f"{message.sticker.id}." + ("webm" if message.sticker.mime_type.endswith("webm") else "webp"))
            print(message.sticker)
            await client.download_media(message.sticker, file=file_path)

    await client.disconnect()

asyncio.run(main())
