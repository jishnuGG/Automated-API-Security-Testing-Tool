"""
Aggregation service for domain-based API log storage.

Instead of storing every API call individually, this service:
1. Upserts aggregated per-website stats into `website_logs`
2. Stores full raw logs into `high_risk_logs` only for high-risk requests
"""

from datetime import datetime
from urllib.parse import urlparse
import sys

from app.database import get_database
from app.models.logs import APILogRequest, RiskAssessment


def extract_domain(url: str) -> str:
    """Extract the domain (hostname) from a URL."""
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or ""
        # Remove 'www.' prefix for cleaner grouping
        if hostname.startswith("www."):
            hostname = hostname[4:]
        return hostname or "unknown"
    except Exception:
        return "unknown"


def extract_path(url: str) -> str:
    """Extract the path from a URL, stripping query params."""
    try:
        parsed = urlparse(url)
        return parsed.path or "/"
    except Exception:
        return "/"


async def upsert_website_log(
    domain: str,
    endpoint_path: str,
    method: str,
    response_time_ms: float,
    risk_score: float,
    is_high_risk: bool,
) -> None:
    """
    Upsert aggregated website log using atomic MongoDB operations.

    Strategy:
    1. Try to update an existing endpoint in the endpoints array
    2. If endpoint doesn't exist yet, push a new one
    3. Always increment domain-level counters
    """
    db = await get_database()
    if db is None:
        print("[aggregation] database not available, skipping upsert", flush=True)
        return

    now = datetime.utcnow()
    collection = db.website_logs

    # Step 1: Update domain-level counters + try to update existing endpoint
    high_risk_inc = 1 if is_high_risk else 0

    result = await collection.update_one(
        {
            "domain": domain,
            "endpoints.path": endpoint_path,
            "endpoints.method": method,
        },
        {
            "$inc": {
                "total_requests": 1,
                "high_risk_count": high_risk_inc,
                "endpoints.$.call_count": 1,
                "endpoints.$.total_response_time_ms": response_time_ms,
            },
            "$set": {
                "last_seen": now,
                "endpoints.$.last_seen": now,
                "endpoints.$.avg_response_time_ms": None,  # placeholder, recalculated below
            },
            "$max": {
                "endpoints.$.max_risk_score": risk_score,
            },
            "$min": {
                "first_seen": now,
            },
        },
        upsert=False,
    )

    if result.modified_count > 0:
        # Recalculate avg_response_time_ms for the matched endpoint
        # We need a pipeline update for this
        await collection.update_one(
            {
                "domain": domain,
                "endpoints.path": endpoint_path,
                "endpoints.method": method,
            },
            [
                {
                    "$set": {
                        "endpoints": {
                            "$map": {
                                "input": "$endpoints",
                                "as": "ep",
                                "in": {
                                    "$cond": {
                                        "if": {
                                            "$and": [
                                                {"$eq": ["$$ep.path", endpoint_path]},
                                                {"$eq": ["$$ep.method", method]},
                                            ]
                                        },
                                        "then": {
                                            "$mergeObjects": [
                                                "$$ep",
                                                {
                                                    "avg_response_time_ms": {
                                                        "$cond": {
                                                            "if": {"$gt": ["$$ep.call_count", 0]},
                                                            "then": {
                                                                "$divide": [
                                                                    "$$ep.total_response_time_ms",
                                                                    "$$ep.call_count",
                                                                ]
                                                            },
                                                            "else": 0,
                                                        }
                                                    }
                                                },
                                            ]
                                        },
                                        "else": "$$ep",
                                    }
                                },
                            }
                        }
                    }
                }
            ],
        )
        return

    # Step 2: Endpoint doesn't exist yet — try to update existing domain doc + push new endpoint
    result = await collection.update_one(
        {"domain": domain},
        {
            "$inc": {
                "total_requests": 1,
                "high_risk_count": high_risk_inc,
            },
            "$set": {
                "last_seen": now,
            },
            "$min": {
                "first_seen": now,
            },
            "$push": {
                "endpoints": {
                    "path": endpoint_path,
                    "method": method,
                    "call_count": 1,
                    "total_response_time_ms": response_time_ms,
                    "avg_response_time_ms": response_time_ms,
                    "max_risk_score": risk_score,
                    "last_seen": now,
                }
            },
        },
        upsert=True,
    )


async def store_high_risk_log(
    log: APILogRequest,
    assessment: RiskAssessment,
    domain: str,
) -> None:
    """Store full raw log for high-risk requests in a separate collection."""
    db = await get_database()
    if db is None:
        print("[aggregation] database not available, skipping high-risk insert", flush=True)
        return

    now = datetime.utcnow()
    document = log.model_dump()
    document.update(assessment.model_dump())
    document["domain"] = domain
    document["created_at"] = now

    await db.high_risk_logs.insert_one(document)
    print(f"[aggregation] stored high-risk log: domain={domain} url={log.url}", flush=True)
