
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_connection():
    url = "mongodb+srv://Jishnu:iqakfEfgevSUxt7C@apilogs.crcqq1y.mongodb.net/?appName=apilogs"
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
