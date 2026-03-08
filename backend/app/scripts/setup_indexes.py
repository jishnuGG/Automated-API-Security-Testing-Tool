"""
Setup script to create recommended MongoDB indexes
for the domain-based aggregation collections.

Run once:
    cd backend
    python -m app.scripts.setup_indexes
"""

import asyncio
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

settings = get_settings()


async def setup_indexes():
    print("[indexes] Connecting to MongoDB...", flush=True)

    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=30000,
    )

    db = client[settings.DATABASE_NAME]

    # ─── website_logs indexes ───────────────────────────────
    print("[indexes] Creating website_logs indexes...", flush=True)

    # Unique index on domain (each domain = one document)
    await db.website_logs.create_index("domain", unique=True)

    # For sorting by activity
    await db.website_logs.create_index("last_seen")

    # For filtering high-risk websites
    await db.website_logs.create_index("high_risk_count")

    # ─── high_risk_logs indexes ─────────────────────────────
    print("[indexes] Creating high_risk_logs indexes...", flush=True)

    # For filtering by domain
    await db.website_logs.create_index("domain")

    # For sorting by time
    await db.high_risk_logs.create_index("timestamp")

    # Compound index: domain + time (most common query pattern)
    await db.high_risk_logs.create_index(
        [("domain", 1), ("timestamp", -1)]
    )

    # TTL index: auto-delete high-risk logs older than 30 days
    await db.high_risk_logs.create_index(
        "created_at",
        expireAfterSeconds=30 * 24 * 60 * 60,  # 30 days
    )

    print("[indexes] ✅ All indexes created successfully!", flush=True)

    # Print summary
    print("\n[indexes] website_logs indexes:", flush=True)
    async for idx in db.website_logs.list_indexes():
        print(f"  - {idx['name']}: {idx['key']}", flush=True)

    print("\n[indexes] high_risk_logs indexes:", flush=True)
    async for idx in db.high_risk_logs.list_indexes():
        print(f"  - {idx['name']}: {idx['key']}", flush=True)

    client.close()


if __name__ == "__main__":
    asyncio.run(setup_indexes())
