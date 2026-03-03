from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime
from enum import Enum

class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class APILogRequest(BaseModel):
    """
    Schema for incoming API logs from the browser extension.
    Using strictly typed fields for validation.
    """
    url: str = Field(..., description="Full URL of the request")
    method: str = Field(..., description="HTTP Method (GET, POST, etc.)")
    headers: Dict[str, str] = Field(default_factory=dict, description="Request headers (sanitized)")
    status_code: int = Field(..., description="HTTP Status Code")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_body_entropy: float = Field(0.0, description="Entropy of the request body (if captured)")
    response_time_ms: float = Field(0.0, description="Response time in milliseconds")
    
    # Analyzed features (can be populated by extension or calculated in backend)
    auth_token_present: bool = False
    is_https: bool = True
    origin: Optional[str] = None

class RiskAssessment(BaseModel):
    """
    Schema for the analysis result returned to the client and stored in DB.
    """
    log_id: Optional[str] = None
    risk_score: float
    risk_level: RiskLevel
    ml_probability: float
    heuristic_score: float
    reasons: List[str] = []
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
