from backend.routers.health import router as health_router
from backend.routers.models import router as models_router
from backend.routers.predict import router as predict_router
from backend.routers.history import router as history_router
from backend.routers.metrics import router as metrics_router
from backend.routers.predictions import router as predictions_router

__all__ = [
    "health_router",
    "models_router",
    "predict_router",
    "history_router",
    "metrics_router",
    "predictions_router",
]
