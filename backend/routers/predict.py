from fastapi import APIRouter, HTTPException, status
from backend.schemas import PredictionRequest, PredictionResponse
from backend.services.ml_service import ml_service

router = APIRouter(prefix="/api", tags=["Prediction"])


@router.post("/predict", response_model=PredictionResponse)
def generate_prediction(request: PredictionRequest):
    """Generate 5-day stock market forecasts using XGBoost, LSTM, and TimesFM models."""
    try:
        response = ml_service.predict_5day(
            ticker=request.ticker,
            period=request.period,
            horizon=request.horizon,
            skip_timesfm=request.skip_timesfm,
        )
        return response
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        print(f"[Error in /api/predict] {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction pipeline encountered an error: {str(e)}"
        )
