
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_connection():
    url = "mongodb://Jishnu:iqakfEfgevSUxt7C@ac-wvb49va-shard-00-00.crcqq1y.mongodb.net:27017,ac-wvb49va-shard-00-01.crcqq1y.mongodb.net:27017,ac-wvb49va-shard-00-02.crcqq1y.mongodb.net:27017/?ssl=true&authSource=admin"
    print(f"Testing connection to: {url}")
    try:
        client = AsyncIOMotorClient(url, tlsInsecure=True, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print("✅ SUCCESS: Connected to MongoDB Atlas!")
        client.close()
    except Exception as e:
        print(f"❌ FAILURE: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
