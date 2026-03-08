from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class EndpointStats(BaseModel):
    """Aggregated statistics for a single API endpoint within a website."""
    path: str = Field(..., description="URL path of the endpoint")
    method: str = Field(..., description="HTTP method (GET, POST, etc.)")
    call_count: int = Field(1, description="Number of times this endpoint was called")
    total_response_time_ms: float = Field(0.0, description="Sum of response times (for avg calculation)")
    avg_response_time_ms: float = Field(0.0, description="Average response time in milliseconds")
    max_risk_score: float = Field(0.0, description="Maximum risk score seen for this endpoint")
    last_seen: datetime = Field(default_factory=datetime.utcnow)


class WebsiteLog(BaseModel):
    """Aggregated log document per website/domain."""
    id: Optional[str] = None
    user_id: str = Field(..., description="Owner user ID from JWT")
    domain: str = Field(..., description="Website domain (e.g., youtube.com)")
    total_requests: int = Field(0, description="Total API requests from this domain")
    high_risk_count: int = Field(0, description="Number of high-risk requests")
    first_seen: datetime = Field(default_factory=datetime.utcnow)
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    endpoints: List[EndpointStats] = Field(default_factory=list)

    class Config:
        from_attributes = True


class HighRiskLog(BaseModel):
    """Full raw log stored only for high-risk API requests."""
    id: Optional[str] = None
    user_id: str = Field(..., description="Owner user ID from JWT")
    domain: str
    url: str
    method: str
    headers: dict = Field(default_factory=dict)
    status_code: int
    response_time_ms: float = 0.0
    request_body_entropy: float = 0.0
    auth_token_present: bool = False
    is_https: bool = True
    origin: Optional[str] = None
    risk_score: float
    risk_level: str
    ml_probability: float
    heuristic_score: float
    reasons: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
