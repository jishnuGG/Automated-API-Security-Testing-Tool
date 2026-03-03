from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings
import sys

settings = get_settings()

class Database:
    client: AsyncIOMotorClient = None
    db = None

    async def connect_to_database(self):
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=10000,  # 10s timeout
                connectTimeoutMS=10000,
            )
            # Verify the connection is actually reachable
            await self.client.admin.command("ping")
            self.db = self.client[settings.DATABASE_NAME]
            print(f"[DB] Successfully connected and pinged MongoDB Atlas (db={settings.DATABASE_NAME})", flush=True)
        except Exception as e:
            print(f"[DB] FATAL: Could not connect to MongoDB Atlas: {e}", file=sys.stderr, flush=True)
            self.client = None
            self.db = None
            raise

    async def close_database_connection(self):
        if self.client:
            self.client.close()
            self.db = None
            print("[DB] MongoDB connection closed.", flush=True)

db_instance = Database()

async def get_database():
    return db_instance.db
