from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.database import init_db
from backend.services.ml_service import ml_service
from backend.routers import (
    health_router,
    models_router,
    predict_router,
    history_router,
    metrics_router,
    predictions_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database & load model artifacts
    print("[Startup] Initializing SQLite database...")
    init_db()
    print("[Startup] Initializing ML models and artifacts...")
    ml_service.initialize_models()
    print("[Startup] StockStreak Backend is ready!")
    yield
    # Shutdown
    print("[Shutdown] Cleaning up resources...")


app = FastAPI(
    title="StockStreak Prediction API",
    description="Professional AI-Powered Stock Market Prediction Platform integrating XGBoost, LSTM, and TimesFM models.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration for Vite dev server & production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router)
app.include_router(models_router)
app.include_router(predict_router)
app.include_router(history_router)
app.include_router(metrics_router)
app.include_router(predictions_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "app": "StockStreak API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "supported_models": ["XGBoost", "LSTM", "TimesFM 2.5"],
    }
