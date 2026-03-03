from fastapi import APIRouter, HTTPException
from typing import List
from app.models.logs import APILogRequest, RiskAssessment
from app.services.ml_service import ml_service
from app.database import get_database
import sys

router = APIRouter()

@router.post("/analyze", response_model=RiskAssessment)
async def analyze_log(log: APILogRequest):
    """
    Analyze an API request log for security risks.
    """
    try:
        # 1. Analyze using ML Service
        assessment = ml_service.analyze(log)

        # 2. Store result in MongoDB (direct await so errors are visible)
        await store_log(log, assessment)

        return assessment
    except HTTPException:
        raise
    except Exception as e:
        print(f"[analyze] Error: {e}", file=sys.stderr, flush=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs", response_model=List[dict])
async def get_logs(limit: int = 50):
    try:
        db = await get_database()
        if db is None:
            print("[analyze:get_logs] no database connection available")
            return []
        cursor = db.logs.find().sort("timestamp", -1).limit(limit)
        logs = await cursor.to_list(length=limit)
        # Convert ObjectId to str if needed, but Pydantic might handle if we use a mapping
        for log in logs:
            if "_id" in log:
                log["_id"] = str(log["_id"])
        return logs
    except Exception as e:
        print(f"Error fetching logs: {e}")
        return []

@router.get("/stats")
async def get_stats():
    try:
        db = await get_database()
        if db is None:
             return {"high": 0, "medium": 0, "low": 0}
             
        stats = {
            "high": await db.logs.count_documents({"risk_level": "High"}),
            "medium": await db.logs.count_documents({"risk_level": "Medium"}),
            "low": await db.logs.count_documents({"risk_level": "Low"})
        }
        return stats
    except Exception as e:
        print(f"Error fetching stats: {e}")
        return {"high": 0, "medium": 0, "low": 0}

async def store_log(log: APILogRequest, assessment: RiskAssessment):
    try:
        db = await get_database()
        if db is None:
            print("[analyze:store_log] database is not available, skipping insert")
            return
        # Use model_dump() — .dict() is deprecated in Pydantic v2
        document = log.model_dump()
        document.update(assessment.model_dump())
        await db.logs.insert_one(document)
        print(f"[analyze:store_log] successfully inserted log for url={log.url}")
    except Exception as e:
        print(f"Failed to store log: {e}")
