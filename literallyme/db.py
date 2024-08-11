from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Any
import time
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from utils import gen_pack_id

load_dotenv()
mongo = AsyncIOMotorClient(os.getenv('MONGO')).literalme

@dataclass
class User:
    user_id: int
    lang: str = 'en'
    start_timestamp: int = field(default_factory=lambda: int(time.time()))
    # (sticker pack id, timestamp)
    packs_created: list[(str, int)] = field(default_factory=list)

    def dict(self) -> dict:
        return asdict(self)

    async def save_to_mongo(self):
        await mongo.users.update_one({'user_id': self.user_id}, {'$set': self.dict()}, upsert=True)

    @classmethod
    async def from_mongo(cls, user_id: int, create_if_not_exists: bool = True, lang: str = 'en') -> User | None:
        user = await mongo.users.find_one({'user_id': user_id})
        if user is None:
            if create_if_not_exists:
                user = cls(user_id)
                user.lang = lang
                await user.save_to_mongo()
                return user
            else:
                return None
        else:
            user.pop('_id')
            return cls(**user)

    async def new_pack(self, photo: bytes) -> StickerPack:
        pack_id = gen_pack_id(self.user_id)
        self.packs_created.append((pack_id, int(time.time())))
        pack = StickerPack(pack_id=pack_id, user_id=self.user_id, input_photo=photo)
        await pack.save_to_mongo()
        await self.save_to_mongo()
        return pack

@dataclass
class StickerPack:
    pack_id: str
    user_id: int
    input_photo: bytes
    timestamp: int = field(default_factory=lambda: int(time.time()))
    status: str = 'queued'
    # a list of (id, access_hash, file_reference) tuples
    documents: list[(int, int, bytes)] = field(default_factory=list)
    emojis: list[str] = field(default_factory=list)
    stages_timestamps: dict[str, int] = field(default_factory=dict)
    worker_info: dict[str, Any] = field(default_factory=dict)
    _id: Any = None

    async def save_to_mongo(self):
        await mongo.sticker_packs.update_one({'pack_id': self.pack_id}, {'$set': self.dict()}, upsert=True)

    def dict(self) -> dict:
        d = asdict(self)
        d.pop('_id')
        return d

    @classmethod
    async def from_mongo(cls, pack_id: str) -> StickerPack | None:
        pack = await mongo.sticker_packs.find_one({'pack_id': pack_id})
        if pack is None:
            return None
        return cls(**pack)

    async def processing(self):
        if self.status == 'processing':
            await self.set_status('retrying1')
            return
        if self.status == 'retrying1':
            await self.set_status('retrying2')
            return
        if self.status == 'retrying2':
            await self.set_status('retrying3')
            return
        await self.set_status('processing')

    async def set_status(self, status: str):
        self.status = status
        self.stages_timestamps[status] = int(time.time())
        await self.save_to_mongo()

    async def add_docs(self, docs: list[(int, int, bytes)], worker_info: dict[str, Any] | None = None):
        self.documents.extend(docs)
        self.status = 'generated'
        self.stages_timestamps['generated'] = int(time.time())
        if worker_info is not None:
            self.worker_info = worker_info
        await self.save_to_mongo()

    @classmethod
    async def random_pack(cls, query: dict) -> StickerPack | None:
        pack = await mongo.sticker_packs.aggregate([
            {'$match': query},
            {'$sample': {'size': 1}}
        ]).to_list(length=1)
        if len(pack) == 0:
            return None
        return cls(**pack[0])

    @classmethod
    async def random_queued_pack(cls) -> StickerPack | None:
        return await cls.random_pack({'status': 'queued'})

    @classmethod
    async def random_generated_pack(cls) -> StickerPack | None:
        # status is "generated" and "created" is not in stages_timestamps
        return await cls.random_pack({
            'status': 'generated',
            'stages_timestamps.created': {'$exists': False}
        })

    @classmethod
    async def random_queued_or_old_processing_pack(cls) -> StickerPack | None:
        five_minutes_ago = int(time.time()) - 600
        query = {
            '$or': [
                {'status': 'queued'},
                {'$and': [
                    {'status': 'processing'},
                    {'stages_timestamps.processing': {'$lte': five_minutes_ago}}
                ]},
                {'$and': [
                    {'status': 'retrying1'},
                    {'stages_timestamps.retrying1': {'$lte': five_minutes_ago}}
                ]},
                {'$and': [
                    {'status': 'retrying2'},
                    {'stages_timestamps.retrying2': {'$lte': five_minutes_ago}}
                ]}
            ]
        }
        return await cls.random_pack(query)
