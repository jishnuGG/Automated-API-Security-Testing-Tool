from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    """Schema for user registration."""
    name: str = Field(..., min_length=2, max_length=100, description="Full name")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=8, description="Password (min 8 chars)")

class UserLogin(BaseModel):
    """Schema for email+password login."""
    email: EmailStr
    password: str

class OTPRequest(BaseModel):
    """Schema for sending OTP to an email."""
    email: EmailStr

class OTPVerify(BaseModel):
    """Schema for verifying an OTP."""
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class UserInDB(BaseModel):
    """Internal user document stored in MongoDB."""
    id: Optional[str] = None
    name: str
    email: str
    hashed_password: str
    is_verified: bool = False
    otp_secret: Optional[str] = None
    otp_expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: dict  # name, email

class UserPublic(BaseModel):
    """Public user info (safe to expose)."""
    name: str
    email: str
    is_verified: bool
