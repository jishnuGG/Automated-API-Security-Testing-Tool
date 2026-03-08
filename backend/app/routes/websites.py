"""
Routes for viewing aggregated website-level API activity.
"""

from fastapi import APIRouter, HTTPException
from typing import List
from app.database import get_database
import sys

router = APIRouter()


@router.get("/websites", response_model=List[dict])
async def get_websites(limit: int = 100):
    """
    List all websites with aggregated stats,
    sorted by last_seen descending.
    """
    try:
        db = await get_database()
        if db is None:
            return []

        cursor = db.website_logs.find(
            {},
            {
                "domain": 1,
                "total_requests": 1,
                "high_risk_count": 1,
                "first_seen": 1,
                "last_seen": 1,
                "endpoints": {"$slice": -10},  # Return last 10 endpoints for summary
            },
        ).sort("last_seen", -1).limit(limit)

        websites = await cursor.to_list(length=limit)

        for site in websites:
            if "_id" in site:
                site["_id"] = str(site["_id"])
            # Add endpoint count
            site["endpoint_count"] = len(site.get("endpoints", []))

        return websites
    except Exception as e:
        print(f"[websites] Error fetching websites: {e}", file=sys.stderr, flush=True)
        return []


@router.get("/websites/{domain}", response_model=dict)
async def get_website_detail(domain: str):
    """
    Get detailed view of a single website including all endpoints.
    """
    try:
        db = await get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")

        site = await db.website_logs.find_one({"domain": domain})
        if site is None:
            raise HTTPException(status_code=404, detail=f"Website '{domain}' not found")

        if "_id" in site:
            site["_id"] = str(site["_id"])

        return site
    except HTTPException:
        raise
    except Exception as e:
        print(f"[websites] Error fetching detail for {domain}: {e}", file=sys.stderr, flush=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/websites/{domain}/high-risk", response_model=List[dict])
async def get_website_high_risk_logs(domain: str, limit: int = 50):
    """
    Get high-risk raw logs for a specific website/domain.
    """
    try:
        db = await get_database()
        if db is None:
            return []

        cursor = db.high_risk_logs.find(
            {"domain": domain}
        ).sort("timestamp", -1).limit(limit)

        logs = await cursor.to_list(length=limit)

        for log in logs:
            if "_id" in log:
                log["_id"] = str(log["_id"])

        return logs
    except Exception as e:
        print(f"[websites] Error fetching high-risk logs for {domain}: {e}", file=sys.stderr, flush=True)
        return []
