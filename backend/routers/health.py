import sys
import platform
from datetime import datetime
import torch
from fastapi import APIRouter
from backend.schemas import HealthResponse
from backend.services.ml_service import ml_service

router = APIRouter(prefix="/api", tags=["System"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Return API health status, system info, and ML model availability."""
    models_status = ml_service.get_model_status()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    py_ver = f"{platform.python_implementation()} {platform.python_version()}"

    return HealthResponse(
        status="ok",
        ml_pipeline_available=True,
        models_available=models_status,
        python_version=py_ver,
        device=device,
        timestamp=datetime.utcnow().isoformat() + "Z"
    )
