import os
import subprocess
import random
import fcntl
import getpass
import socket

from telethon.tl.types import InputMediaUploadedDocument, InputPeerSelf, InputPeerChat
from telethon.tl.functions.messages import UploadMediaRequest, GetMessagesRequest
from telethon.utils import get_input_document
from telethon import types, functions
import telethon
from telethon.tl.types import InputDocument, DocumentAttributeFilename

def gen_pack_id(user_id: int) -> str:
    return f"literally{user_id}_{random.randint(0, 10000)}"


def process_sticker(filename: str) -> str:
    new_filename = os.path.splitext(filename)[0] + '.webm'

    command = [
        'ffmpeg',
        '-i', filename,  # Input file
        '-vf', "geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte(r(X,Y)+g(X,Y)+b(X,Y),0),0,255)',format=yuva420p,scale='if(gte(iw,ih),512,-1)':'if(gte(ih,iw),512,-1)'",
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


def process_sticker_with_transparency(filename: str) -> str:
    new_filename = os.path.splitext(filename)[0] + '_transparent.webm'

    command = [
        'ffmpeg',
        '-i', filename,  # Input file
        '-vf', "geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte(r(X,Y)+g(X,Y)+b(X,Y),0),0,255)',format=yuva420p,scale='if(gte(iw,ih),512,-1)':'if(gte(ih,iw),512,-1)'",
        '-c:v', 'libvpx-vp9',
        '-auto-alt-ref', '0',
        '-t', '3',  # Set duration to 3 seconds
        '-y',  # Overwrite output file if it exists
        new_filename  # Output file
    ]

    # Run the command
    try:
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError:
        print('Error while processing sticker with transparency', filename)
        return ''

    return new_filename


async def download_file(bot, doc_id: int, doc_hash: int, doc_ref: bytes) -> str:
    try:
        filename = f"/tmp/{doc_ref.hex()}"
        if os.path.exists(filename):
            return filename
        
        file_location = types.InputDocumentFileLocation(
            id=doc_id,
            access_hash=doc_hash,
            file_reference=doc_ref,
            thumb_size=''  # Empty string for the full file
        )
        
        # Download the file
        await bot.download_file(file_location, file=filename)
        
        return filename
    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        return ''


async def get_file_size(bot, doc_id: int, doc_hash: int, doc_ref: bytes, remove: bool = False) -> (int, str):
    try:
        filename = await download_file(bot, doc_id, doc_hash, doc_ref)
        if not filename:
            return 0
        
        # Get the file size
        file_size = os.path.getsize(filename)
        
        if remove:
            os.remove(filename)
        
        return file_size, filename
    except Exception as e:
        print(f"Error getting file size: {str(e)}")
        return 0


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


def lock_file(file_path: str):
    with open(file_path, 'w') as file:
        file.write(str(os.getpid()))
        fcntl.flock(file, fcntl.LOCK_EX | fcntl.LOCK_NB)


def get_username() -> str:
    return getpass.getuser() + '@' + socket.gethostname()

