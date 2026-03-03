from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "API Security Monitor"
    DEBUG_MODE: bool = True
    VERSION: str = "1.0.0"
    
    # Database
    MONGODB_URL: str = "mongodb+srv://Jishnu:iqakfEfgevSUxt7C@apilogs.crcqq1y.mongodb.net/?appName=apilogs"
    DATABASE_NAME: str = "api_security_db"
    
    # ML Model Paths
    MODEL_PATH: str = "app/ml/models/security_model.joblib"
    VECTORIZER_PATH: str = "app/ml/models/vectorizer.joblib"
    
    # Risk Scoring Weights
    ML_WEIGHT: float = 0.7
    HEURISTIC_WEIGHT: float = 0.3

    # JWT Auth
    SECRET_KEY: str = "a8f3c2d1e9b7f4a0c5d8e1f2b3a4c9d0e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # OTP Email
    EMAIL_SENDER: str = ""
    EMAIL_PASSWORD: str = ""
    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    OTP_DEV_MODE: bool = True   # If True, OTP is returned in API response (no email sent)

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
