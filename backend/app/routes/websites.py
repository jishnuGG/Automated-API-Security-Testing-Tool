"""
Routes for viewing aggregated website-level API activity.
All endpoints require JWT authentication and filter by user_id.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import get_database
from app.dependencies.auth_dependency import get_current_user
import sys

router = APIRouter()


@router.get("/websites", response_model=List[dict])
async def get_websites(limit: int = 100, current_user: dict = Depends(get_current_user)):
    """
    List all websites with aggregated stats for the authenticated user.
    """
    try:
        db = await get_database()
        if db is None:
            return []

        query = {"user_id": current_user["user_id"]}
        cursor = db.website_logs.find(
            query,
            {
                "domain": 1,
                "total_requests": 1,
                "high_risk_count": 1,
                "first_seen": 1,
                "last_seen": 1,
                "endpoints": {"$slice": -10},
            },
        ).sort("last_seen", -1).limit(limit)

        websites = await cursor.to_list(length=limit)

        for site in websites:
            if "_id" in site:
                site["_id"] = str(site["_id"])
            site["endpoint_count"] = len(site.get("endpoints", []))

        return websites
    except Exception as e:
        print(f"[websites] Error fetching websites: {e}", file=sys.stderr, flush=True)
        return []


@router.get("/websites/{domain}", response_model=dict)
async def get_website_detail(domain: str, current_user: dict = Depends(get_current_user)):
    """
    Get detailed view of a single website for the authenticated user.
    """
    try:
        db = await get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")

        site = await db.website_logs.find_one({
            "domain": domain,
            "user_id": current_user["user_id"],
        })
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
async def get_website_high_risk_logs(domain: str, limit: int = 50, current_user: dict = Depends(get_current_user)):
    """
    Get high-risk raw logs for a specific website for the authenticated user.
    """
    try:
        db = await get_database()
        if db is None:
            return []

        cursor = db.high_risk_logs.find({
            "domain": domain,
            "user_id": current_user["user_id"],
        }).sort("timestamp", -1).limit(limit)

        logs = await cursor.to_list(length=limit)

        for log in logs:
            if "_id" in log:
                log["_id"] = str(log["_id"])

        return logs
    except Exception as e:
        print(f"[websites] Error fetching high-risk logs for {domain}: {e}", file=sys.stderr, flush=True)
        return []
