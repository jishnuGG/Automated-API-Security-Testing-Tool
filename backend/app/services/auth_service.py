import pyotp
import smtplib
import sys
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

settings = get_settings()

# ─── Password Hashing ─────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# ─── JWT ──────────────────────────────────────────────────────────────────────
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

# ─── OTP ──────────────────────────────────────────────────────────────────────
OTP_VALID_MINUTES = 10

def generate_otp() -> tuple[str, str, datetime]:
    """
    Returns (otp_code, otp_secret, expires_at).
    otp_secret is stored in DB; otp_code is sent to user.
    """
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret, interval=OTP_VALID_MINUTES * 60, digits=6)
    otp_code = totp.now()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_VALID_MINUTES)
    return otp_code, secret, expires_at

def verify_otp(otp_code: str, otp_secret: str, expires_at: datetime) -> bool:
    if datetime.utcnow() > expires_at:
        return False
    totp = pyotp.TOTP(otp_secret, interval=OTP_VALID_MINUTES * 60, digits=6)
    return totp.verify(otp_code, valid_window=1)

# ─── Email ────────────────────────────────────────────────────────────────────
def send_otp_email(to_email: str, otp_code: str, purpose: str = "verification") -> bool:
    """
    Sends OTP email via SMTP. Returns False if in dev mode or if it fails.
    In dev mode (OTP_DEV_MODE=True), the OTP is returned in the API response instead.
    """
    if settings.OTP_DEV_MODE or not settings.EMAIL_SENDER or not settings.EMAIL_PASSWORD:
        print(f"[Auth] DEV MODE — OTP for {to_email}: {otp_code}", flush=True)
        return False  # Signal that email was NOT sent (code is in API response)

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"API Security Monitor — Your {purpose.title()} OTP"
        msg["From"] = settings.EMAIL_SENDER
        msg["To"] = to_email

        html = f"""
        <html><body style="font-family:Arial,sans-serif;background:#0a0a0a;color:#00ff88;padding:40px;">
            <div style="max-width:480px;margin:auto;background:#111;border:1px solid #00ff8840;border-radius:12px;padding:32px;">
                <h2 style="color:#00ff88;margin:0 0 8px">🔐 API Security Monitor</h2>
                <p style="color:#aaa;">Your one-time password for <strong>{purpose}</strong>:</p>
                <div style="background:#0a0a0a;border:1px solid #00ff8860;border-radius:8px;padding:20px;
                            text-align:center;letter-spacing:12px;font-size:28px;font-weight:bold;
                            color:#00ff88;margin:20px 0;">{otp_code}</div>
                <p style="color:#666;font-size:13px;">This code expires in {OTP_VALID_MINUTES} minutes. Do not share it.</p>
            </div>
        </body></html>
        """
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.EMAIL_SENDER, settings.EMAIL_PASSWORD)
            server.sendmail(settings.EMAIL_SENDER, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[Auth] Failed to send OTP email: {e}", file=sys.stderr, flush=True)
        return False
