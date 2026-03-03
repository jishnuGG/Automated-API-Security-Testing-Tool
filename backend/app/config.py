from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "API Security Monitor"
    DEBUG_MODE: bool = True
    VERSION: str = "1.0.0"
    
    # Database
    # NOTE: the default URL includes credentials and points to the Atlas cluster used
    # for development.  In production you should override this with a secure
    # environment variable (see `.env` file).  The database itself is selected
    # separately via DATABASE_NAME, which must match the name you inspect in
    # the Atlas dashboard.
    MONGODB_URL: str = "mongodb+srv://Jishnu:iqakfEfgevSUxt7C@apilogs.crcqq1y.mongodb.net/?appName=apilogs"
    DATABASE_NAME: str = "api_security_db"  # default chosen to match `.env`
    
    # ML Model Paths
    MODEL_PATH: str = "app/ml/models/security_model.joblib"
    VECTORIZER_PATH: str = "app/ml/models/vectorizer.joblib"
    
    # Risk Scoring Weights
    ML_WEIGHT: float = 0.7
    HEURISTIC_WEIGHT: float = 0.3

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
