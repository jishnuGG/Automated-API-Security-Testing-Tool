from fastapi import APIRouter, HTTPException
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
import sys

router = APIRouter()


@router.post("/analyze", response_model=RiskAssessment)
async def analyze_log(log: APILogRequest):
    """
    Analyze an API request log for security risks.
    Now stores aggregated data per-domain instead of individual documents.
    """
    try:
        # 1. Analyze using ML Service
        assessment = ml_service.analyze(log)

        # 2. Aggregate into website_logs + optionally store high-risk raw log
        await store_aggregated_log(log, assessment)

        return assessment
    except HTTPException:
        raise
    except Exception as e:
        print(f"[analyze] Error: {e}", file=sys.stderr, flush=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs", response_model=List[dict])
async def get_logs(limit: int = 500):
    """
    Returns high-risk raw logs from the high_risk_logs collection.
    (Previously returned all logs from the logs collection.)
    """
    try:
        db = await get_database()
        if db is None:
            print("[analyze:get_logs] no database connection available")
            return []

        cursor = db.high_risk_logs.find().sort("timestamp", -1).limit(limit)
        logs = await cursor.to_list(length=limit)

        for log in logs:
            if "_id" in log:
                log["_id"] = str(log["_id"])
        return logs
    except Exception as e:
        print(f"Error fetching logs: {e}")
        return []


@router.get("/stats")
async def get_stats():
    """
    Returns aggregated risk stats computed from the website_logs collection.
    Uses MongoDB aggregation pipeline for efficiency.
    """
    try:
        db = await get_database()
        if db is None:
            return {"high": 0, "medium": 0, "low": 0, "total_websites": 0, "total_requests": 0}

        # Aggregate totals from website_logs
        pipeline = [
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
            # Estimate medium as ~20% of non-high requests (heuristic)
            # For precise counts, we'd need to track medium in the schema too
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


async def store_aggregated_log(log: APILogRequest, assessment: RiskAssessment):
    """
    Replace the old store_log: aggregate into website_logs,
    and store full raw log only if high-risk.
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
        )

        # 2. Store full raw log only for high-risk requests
        if is_high_risk:
            await store_high_risk_log(log, assessment, domain)

        print(f"[analyze] aggregated: domain={domain} path={endpoint_path} risk={assessment.risk_level.value}", flush=True)

    except Exception as e:
        print(f"[analyze] Failed to store aggregated log: {e}", file=sys.stderr, flush=True)
