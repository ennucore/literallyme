from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Any
import time
from pymongo import MongoClient
from dotenv import load_dotenv
import os

from utils import gen_pack_id

load_dotenv()

mongo = MongoClient(os.getenv('MONGO')).literalme


@dataclass
class User:
    user_id: int
    lang: str = 'en'
    start_timestamp: int = field(default_factory=lambda: int(time.time()))
    # (sticker pack id, timestamp)
    packs_created: list[(str, int)] = field(default_factory=list)

    def dict(self) -> dict:
        return asdict(self)

    def save_to_mongo(self):
        mongo.users.update_one({'user_id': self.user_id}, {'$set': self.dict()}, upsert=True)

    @classmethod
    def from_mongo(cls, user_id: int, create_if_not_exists: bool = True, lang: str = 'en') -> User | None:
        user = mongo.users.find_one({'user_id': user_id})
        if user is None:
            if create_if_not_exists:
                user = cls(user_id)
                user.lang = lang
                user.save_to_mongo()
                return user
            else:
                return None
        else:
            user.pop('_id')
            return cls(**user)

    def new_pack(self, photo: bytes) -> StickerPack:
        pack_id = gen_pack_id(self.user_id)
        self.packs_created.append((pack_id, int(time.time())))
        pack = StickerPack(pack_id=pack_id, user_id=self.user_id, input_photo=photo)
        pack.save_to_mongo()
        self.save_to_mongo()
        print(pack)
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
    _id: Any = None

    def save_to_mongo(self):
        mongo.sticker_packs.update_one({'pack_id': self.pack_id}, {'$set': self.dict()}, upsert=True)

    def dict(self) -> dict:
        d = asdict(self)
        d.pop('_id')
        return d

    @classmethod
    def from_mongo(cls, pack_id: str) -> StickerPack | None:
        pack = mongo.sticker_packs.find_one({'pack_id': pack_id})
        if pack is None:
            return None
        return cls(**pack)

    def processing(self):
        if self.status == 'processing':
            self.set_status('retrying1')
            return
        if self.status == 'retrying1':
            self.set_status('retrying2')
            return
        self.set_status('processing')

    def set_status(self, status: str):
        self.status = status
        self.stages_timestamps[status] = int(time.time())
        self.save_to_mongo()

    def add_docs(self, docs: list[(int, int, bytes)]):
        self.documents.extend(docs)
        self.status = 'generated'
        self.stages_timestamps['generated'] = int(time.time())
        self.save_to_mongo()

    @classmethod
    def random_pack(cls, query: dict) -> StickerPack | None:
        pack = mongo.sticker_packs.aggregate([
            {'$match': query},
            {'$sample': {'size': 1}}
        ])
        pack = list(pack)
        if len(pack) == 0:
            return None
        return cls(**pack[0])

    @classmethod
    def random_queued_pack(cls) -> StickerPack | None:
        return cls.random_pack({'status': 'queued'})

    @classmethod
    def random_generated_pack(cls) -> StickerPack | None:
        # status is "generated" and "created" is not in stages_timestamps
        return cls.random_pack({
            'status': 'generated',
            'stages_timestamps.created': {'$exists': False}
        })

    @classmethod
    def random_queued_or_old_processing_pack(cls) -> StickerPack | None:
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
                ]}
            ]
        }
        return cls.random_pack(query)
