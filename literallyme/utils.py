import os
import subprocess
import random

from telethon.tl.types import InputMediaUploadedDocument, InputPeerSelf, InputPeerChat
from telethon.tl.functions.messages import UploadMediaRequest
from telethon.utils import get_input_document


def gen_pack_id(user_id: int) -> str:
    return f"literally{user_id}_{random.randint(0, 10000)}"


def process_sticker(filename: str) -> str:
    new_filename = os.path.splitext(filename)[0] + '.webm'

    command = [
        'ffmpeg',
        '-i', filename,  # Input file
        '-vf', "scale='min(512,iw):-1',colorkey=0x000000:0.003:0.003",
        '-y',  # Overwrite output file if it exists
        '-an',  # Remove audio
        '-t', '3',  # Set duration to 3 seconds
        '-b:v', '0.3M',
        '-c:v', 'libvpx-vp9',  # Video codec
        new_filename  # Output file
    ]

    # Run the command
    try:
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError:
        print('Error while processing sticker', filename)
        return ''

    return new_filename


async def upload_file(bot, file_path: str) -> (int, int, bytes):
    # Upload the file and return the tuple (id, access_hash, file_reference)
    with open(file_path, 'rb') as file:
        uploaded_file = await bot.upload_file(file)

        # file = InputMediaUploadedDocument(uploaded_file, "video/webm", [])
        # document = (await bot(UploadMediaRequest(InputPeerSelf(), file))).document

        file = InputMediaUploadedDocument(uploaded_file, "video/webm", [])
        document = (await bot(UploadMediaRequest(
            random.choice([
                InputPeerSelf(), InputPeerChat(4181903758), InputPeerChat(4131728434),
                InputPeerChat(4144993566), InputPeerChat(4155023068)
                           ]), file))).document
        return document.id, document.access_hash, document.file_reference
