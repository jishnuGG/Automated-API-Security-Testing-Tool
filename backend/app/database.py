from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

settings = get_settings()

class Database:
    client: AsyncIOMotorClient = None
    db = None

    async def connect_to_database(self):
        self.client = AsyncIOMotorClient(settings.MONGODB_URL)
        self.db = self.client[settings.DATABASE_NAME]
        print(f"Connected to MongoDB at {settings.MONGODB_URL}")

    async def close_database_connection(self):
        if self.client:
            self.client.close()
            print("MongoDB connection closed.")

db_instance = Database()

async def get_database():
    return db_instance.db
