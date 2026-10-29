from typing import List
from fastapi import APIRouter
from backend.schemas import PredictionRecord
from backend.database import get_recent_predictions

router = APIRouter(prefix="/api", tags=["Prediction History"])


@router.get("/predictions", response_model=List[PredictionRecord])
def get_prediction_history():
    """Retrieve recent stock prediction records stored in the SQLite history database."""
    records = get_recent_predictions(limit=20)
    return records
