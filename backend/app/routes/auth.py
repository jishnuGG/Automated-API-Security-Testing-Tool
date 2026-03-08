from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import UserCreate, UserLogin, OTPRequest, OTPVerify, Token
from app.services.auth_service import (
    hash_password, verify_password, create_access_token,
    generate_otp, verify_otp, send_otp_email
)
from app.database import get_database
from app.config import get_settings
from app.dependencies.auth_dependency import get_current_user

router = APIRouter()
settings = get_settings()

# ─── Helpers ──────────────────────────────────────────────────────────────────
async def _get_user_by_email(email: str):
    db = await get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return await db.users.find_one({"email": email.lower()})

async def _update_user(email: str, update: dict):
    db = await get_database()
    await db.users.update_one({"email": email.lower()}, {"$set": update})

# ─── Register ─────────────────────────────────────────────────────────────────
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user. Sends (or returns in dev mode) an OTP to verify their email.
    """
    db = await get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    email = user_data.email.lower()

    existing = await db.users.find_one({"email": email})
    if existing:
        if existing.get("is_verified"):
            raise HTTPException(status_code=409, detail="Email already registered. Please login.")
        # Re-send OTP for unverified account
    
    otp_code, otp_secret, expires_at = generate_otp()
    hashed_pw = hash_password(user_data.password)

    user_doc = {
        "name": user_data.name,
        "email": email,
        "hashed_password": hashed_pw,
        "is_verified": False,
        "otp_secret": otp_secret,
        "otp_expires_at": expires_at,
    }

    if existing:
        await db.users.replace_one({"email": email}, user_doc)
    else:
        await db.users.insert_one(user_doc)

    email_sent = send_otp_email(email, otp_code, purpose="registration")

    response = {
        "message": "Registration started. Check your email for the OTP.",
        "email": email,
    }
    if not email_sent:
        # Dev mode — return OTP in response for easy testing
        response["dev_otp"] = otp_code
        response["note"] = "OTP_DEV_MODE is active. OTP returned in response (not emailed)."

    return response

# ─── Verify OTP (after registration) ─────────────────────────────────────────
@router.post("/verify-otp")
async def verify_registration_otp(data: OTPVerify):
    user = await _get_user_by_email(data.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("is_verified"):
        raise HTTPException(status_code=400, detail="Account already verified. Please login.")

    if not verify_otp(data.otp, user["otp_secret"], user["otp_expires_at"]):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    await _update_user(data.email, {
        "is_verified": True,
        "otp_secret": None,
        "otp_expires_at": None,
    })

    token = create_access_token({"sub": user["email"], "name": user["name"], "user_id": str(user["_id"])})
    return Token(
        access_token=token,
        user={"name": user["name"], "email": user["email"]}
    )

# ─── Login with Email + Password ──────────────────────────────────────────────
@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await _get_user_by_email(credentials.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("is_verified"):
        raise HTTPException(status_code=403, detail="Email not verified. Please complete OTP verification.")
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user["email"], "name": user["name"], "user_id": str(user["_id"])})
    return Token(
        access_token=token,
        user={"name": user["name"], "email": user["email"]}
    )

# ─── Send OTP for passwordless login ──────────────────────────────────────────
@router.post("/send-otp")
async def send_login_otp(data: OTPRequest):
    user = await _get_user_by_email(data.email)
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email. Please register.")
    if not user.get("is_verified"):
        raise HTTPException(status_code=403, detail="Email not yet verified.")

    otp_code, otp_secret, expires_at = generate_otp()
    await _update_user(data.email, {
        "otp_secret": otp_secret,
        "otp_expires_at": expires_at,
    })

    email_sent = send_otp_email(data.email, otp_code, purpose="login")

    response = {"message": "OTP sent to your email.", "email": data.email}
    if not email_sent:
        response["dev_otp"] = otp_code
        response["note"] = "OTP_DEV_MODE is active."

    return response

# ─── Login with OTP ───────────────────────────────────────────────────────────
@router.post("/login-otp", response_model=Token)
async def login_with_otp(data: OTPVerify):
    user = await _get_user_by_email(data.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.get("is_verified"):
        raise HTTPException(status_code=403, detail="Email not verified.")
    if not user.get("otp_secret"):
        raise HTTPException(status_code=400, detail="No OTP was requested. Use /send-otp first.")

    if not verify_otp(data.otp, user["otp_secret"], user["otp_expires_at"]):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    await _update_user(data.email, {"otp_secret": None, "otp_expires_at": None})

    token = create_access_token({"sub": user["email"], "name": user["name"], "user_id": str(user["_id"])})
    return Token(
        access_token=token,
        user={"name": user["name"], "email": user["email"]}
    )

# ─── Get current user (for frontend/extension validation) ────────────────────
@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "name": current_user["name"],
    }
