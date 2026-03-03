from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import get_settings
from app.database import db_instance
from app.routes import analyze

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db_instance.connect_to_database()
    yield
    # Shutdown
    await db_instance.close_database_connection()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Include Routers
app.include_router(analyze.router, prefix="/api/v1", tags=["Analysis"])

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "API Security Monitor Backend is Running", "status": "active"}

@app.get("/health")
async def health_check():
    status = "disconnected"
    db_name = None
    if db_instance.client:
        status = "connected"
        db_name = getattr(db_instance, "db", None)
        if db_name:
            # the MotorCollection object repr includes the db name
            db_name = db_instance.db.name
    return {"database": status, "db_name": db_name}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG_MODE)
