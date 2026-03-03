from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings
import certifi
import sys

settings = get_settings()

class Database:
    client: AsyncIOMotorClient = None
    db = None

    async def connect_to_database(self):
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                tlsCAFile=certifi.where(),   # ✅ FIX
                serverSelectionTimeoutMS=30000
            )

            await self.client.admin.command("ping")

            self.db = self.client[settings.DATABASE_NAME]

            print(f"[DB] Connected to MongoDB Atlas", flush=True)

        except Exception as e:
            print(f"[DB] FATAL: {e}", file=sys.stderr, flush=True)
            raise

    async def close_database_connection(self):
        if self.client:
            self.client.close()
            self.db = None
            print("[DB] MongoDB connection closed.", flush=True)

db_instance = Database()

async def get_database():
    return db_instance.db