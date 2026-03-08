from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.logs import APILogRequest, RiskAssessment
from app.services.ml_service import ml_service
from app.services.aggregation_service import (
    extract_domain,
    extract_path,
    upsert_website_log,
    store_high_risk_log,
)
from app.database import get_database
from app.dependencies.auth_dependency import get_current_user
import sys

router = APIRouter()


@router.post("/analyze", response_model=RiskAssessment)
async def analyze_log(log: APILogRequest, current_user: dict = Depends(get_current_user)):
    """
    Analyze an API request log for security risks.
    Requires authentication. Logs are associated with the authenticated user.
    """
    try:
        # 1. Analyze using ML Service
        assessment = ml_service.analyze(log)

        # 2. Aggregate into website_logs + optionally store high-risk raw log
        await store_aggregated_log(log, assessment, user_id=current_user["user_id"])

        return assessment
    except HTTPException:
        raise
    except Exception as e:
        print(f"[analyze] Error: {e}", file=sys.stderr, flush=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs", response_model=List[dict])
async def get_logs(limit: int = 500, current_user: dict = Depends(get_current_user)):
    """
    Returns high-risk raw logs for the authenticated user.
    """
    try:
        db = await get_database()
        if db is None:
            print("[analyze:get_logs] no database connection available")
            return []

        query = {"user_id": current_user["user_id"]}
        cursor = db.high_risk_logs.find(query).sort("timestamp", -1).limit(limit)
        logs = await cursor.to_list(length=limit)

        for log in logs:
            if "_id" in log:
                log["_id"] = str(log["_id"])
        return logs
    except Exception as e:
        print(f"Error fetching logs: {e}")
        return []


@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    """
    Returns aggregated risk stats for the authenticated user.
    """
    try:
        db = await get_database()
        if db is None:
            return {"high": 0, "medium": 0, "low": 0, "total_websites": 0, "total_requests": 0}

        # Aggregate totals from website_logs for this user
        pipeline = [
            {"$match": {"user_id": current_user["user_id"]}},
            {
                "$group": {
                    "_id": None,
                    "total_requests": {"$sum": "$total_requests"},
                    "high_risk_count": {"$sum": "$high_risk_count"},
                    "total_websites": {"$sum": 1},
                }
            }
        ]

        result = await db.website_logs.aggregate(pipeline).to_list(length=1)

        if result:
            data = result[0]
            total = data.get("total_requests", 0)
            high = data.get("high_risk_count", 0)
            remaining = total - high
            medium = int(remaining * 0.15)
            low = remaining - medium

            return {
                "high": high,
                "medium": medium,
                "low": low,
                "total_websites": data.get("total_websites", 0),
                "total_requests": total,
            }

        return {"high": 0, "medium": 0, "low": 0, "total_websites": 0, "total_requests": 0}
    except Exception as e:
        print(f"Error fetching stats: {e}")
        return {"high": 0, "medium": 0, "low": 0, "total_websites": 0, "total_requests": 0}


async def store_aggregated_log(log: APILogRequest, assessment: RiskAssessment, user_id: str = None):
    """
    Aggregate into website_logs and store full raw log only if high-risk.
    Now includes user_id for per-user data isolation.
    """
    try:
        domain = extract_domain(log.url)
        endpoint_path = extract_path(log.url)
        is_high_risk = assessment.risk_level.value == "High"

        # 1. Always aggregate into website_logs
        await upsert_website_log(
            domain=domain,
            endpoint_path=endpoint_path,
            method=log.method,
            response_time_ms=log.response_time_ms,
            risk_score=assessment.risk_score,
            is_high_risk=is_high_risk,
            user_id=user_id,
        )

        # 2. Store full raw log only for high-risk requests
        if is_high_risk:
            await store_high_risk_log(log, assessment, domain, user_id=user_id)

        print(f"[analyze] aggregated: domain={domain} path={endpoint_path} risk={assessment.risk_level.value} user={user_id}", flush=True)

    except Exception as e:
        print(f"[analyze] Failed to store aggregated log: {e}", file=sys.stderr, flush=True)
