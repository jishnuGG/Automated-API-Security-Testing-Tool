"""
JWT Authentication Dependency for FastAPI.

Provides `get_current_user` — a FastAPI Depends() that extracts and verifies
the JWT token from the Authorization: Bearer header.

Used to protect routes and extract user_id for data isolation.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.services.auth_service import decode_access_token
from app.database import get_database

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Decode the JWT token and return the current user's info.

    Returns:
        dict with keys: user_id, email, name

    Raises:
        HTTPException 401 if token is invalid, expired, or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    email: str = payload.get("sub")
    user_id: str = payload.get("user_id")
    name: str = payload.get("name")

    if email is None:
        raise credentials_exception

    # If user_id was not in the token (old tokens before this update),
    # look it up from the database
    if user_id is None:
        db = await get_database()
        if db is not None:
            user = await db.users.find_one({"email": email})
            if user:
                user_id = str(user["_id"])
            else:
                raise credentials_exception
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database unavailable",
            )

    return {
        "user_id": user_id,
        "email": email,
        "name": name or "",
    }
