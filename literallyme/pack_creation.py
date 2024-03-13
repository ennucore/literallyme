import os

from telethon import types, functions

from utils import process_sticker, gen_pack_id, upload_file


async def documents_from_directory(bot, directory: str) -> list[(int, int, bytes)]:
    documents = []
    for filename in os.listdir(directory):
        if filename.endswith('.webm'):
            continue
        file_path = os.path.join(directory, filename)
        file_path = process_sticker(file_path)
        documents.append(await upload_file(bot, file_path))
    return documents


async def create_sticker_pack(bot, user_id, documents: list[(int, int, bytes)], title='', name_suffix=''):
    # Initialize the client with your bot token
    bot_name = (await bot.get_me()).username
    # print(user_id, title, bot_name)
    # Create a new sticker pack
    name_suffix = name_suffix or gen_pack_id(user_id)

    stickers = []
    emojis = ['🗿', '🙂', '😏', '😂', '🙃', '😨', '🧐', '😏', '😁', '🫠', '🗿👍', '💪🌈',
              '😡', '😘💋', '🤡📷', '👀', '🕺', '🩸'] + ['👍'] * 100
    for emoji, (doc_id, doc_hash, doc_ref) in zip(emojis, documents):
        if not doc_id:
            continue
        input_document = types.InputDocument(
            id=doc_id,
            access_hash=doc_hash,
            file_reference=doc_ref
        )
        # convert to InputDocument
        stickers.append(types.InputStickerSetItem(
            document=input_document,
            emoji=emoji  # Replace with desired emoji for the sticker
        ))

    # final_sticker_data = (5285307220253230406, 4934858480140185315,
    #                       b'\x03\x00\x00"\xb2e\xaa\xa0f\xc1\xb5\'\xae\xb8\x15~\xdc\x9a\xc3\x9b\t\xbe\xe8\xe2x')
    # input_document = types.InputDocument(
    #     id=final_sticker_data[0],
    #     access_hash=final_sticker_data[1],
    #     file_reference=final_sticker_data[2]
    # )
    # stickers.append(types.InputStickerSetItem(
    #     document=input_document,
    #     emoji='🗿'
    # ))

    sticker_set = await bot(functions.stickers.CreateStickerSetRequest(
        user_id=user_id,
        title=title or ('created in @' + bot_name),
        short_name=f"{name_suffix}_by_{bot_name}",
        stickers=stickers,
        videos=True
    ))

    return sticker_set
