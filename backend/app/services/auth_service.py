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

# ─────────────────────────────────────────────────────────────
# Password Hashing
# ─────────────────────────────────────────────────────────────

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt.
    bcrypt supports max 72 bytes, so truncate if longer.
    """
    password = password[:BCRYPT_MAX_BYTES]
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password safely.
    """
    plain_password = plain_password[:BCRYPT_MAX_BYTES]
    return pwd_context.verify(plain_password, hashed_password)


# ─────────────────────────────────────────────────────────────
# JWT Authentication
# ─────────────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
    except JWTError:
        return None


# ─────────────────────────────────────────────────────────────
# OTP System
# ─────────────────────────────────────────────────────────────

OTP_VALID_MINUTES = 10


def generate_otp() -> tuple[str, str, datetime]:
    """
    Returns:
        otp_code
        otp_secret
        expires_at
    """
    secret = pyotp.random_base32()

    totp = pyotp.TOTP(
        secret,
        interval=OTP_VALID_MINUTES * 60,
        digits=6
    )

    otp_code = totp.now()

    expires_at = datetime.utcnow() + timedelta(
        minutes=OTP_VALID_MINUTES
    )

    return otp_code, secret, expires_at


def verify_otp(otp_code: str, otp_secret: str, expires_at: datetime) -> bool:

    if datetime.utcnow() > expires_at:
        return False

    totp = pyotp.TOTP(
        otp_secret,
        interval=OTP_VALID_MINUTES * 60,
        digits=6
    )

    return totp.verify(otp_code, valid_window=1)


# ─────────────────────────────────────────────────────────────
# Email Service
# ─────────────────────────────────────────────────────────────

def send_otp_email(to_email: str, otp_code: str, purpose: str = "verification") -> bool:
    """
    Sends OTP email.

    If OTP_DEV_MODE=True:
        OTP is printed in backend console
        and returned in API response.
    """

    if settings.OTP_DEV_MODE or not settings.EMAIL_SENDER or not settings.EMAIL_PASSWORD:
        print(f"[Auth] DEV MODE — OTP for {to_email}: {otp_code}", flush=True)
        return False

    try:
        msg = MIMEMultipart("alternative")

        msg["Subject"] = f"API Security Monitor — Your {purpose.title()} OTP"
        msg["From"] = settings.EMAIL_SENDER
        msg["To"] = to_email

        html = f"""
        <html>
        <body style="font-family:Arial;background:#0a0a0a;color:#00ff88;padding:40px;">

            <div style="
                max-width:480px;
                margin:auto;
                background:#111;
                border:1px solid #00ff8840;
                border-radius:12px;
                padding:32px;
            ">

                <h2 style="color:#00ff88;">🔐 API Security Monitor</h2>

                <p>Your OTP for <b>{purpose}</b>:</p>

                <div style="
                    background:#0a0a0a;
                    border:1px solid #00ff8860;
                    border-radius:8px;
                    padding:20px;
                    text-align:center;
                    letter-spacing:12px;
                    font-size:28px;
                    font-weight:bold;
                    color:#00ff88;
                ">
                    {otp_code}
                </div>

                <p style="color:#777;font-size:13px;margin-top:20px;">
                    This OTP expires in {OTP_VALID_MINUTES} minutes.
                </p>

            </div>

        </body>
        </html>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.EMAIL_SENDER, settings.EMAIL_PASSWORD)

            server.sendmail(
                settings.EMAIL_SENDER,
                to_email,
                msg.as_string()
            )

        return True

    except Exception as e:
        print(f"[Auth] Failed to send OTP email: {e}", file=sys.stderr, flush=True)
        return False