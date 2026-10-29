from fastapi import APIRouter, HTTPException, status
from backend.schemas import MetricsResponse
from backend.services.ml_service import ml_service

router = APIRouter(prefix="/api", tags=["Evaluation Metrics"])


@router.get("/metrics/{ticker}", response_model=MetricsResponse)
def get_model_metrics(ticker: str):
    """Return historical backtest evaluation metrics (MAE and RMSE) for the requested ticker."""
    ticker_clean = ticker.strip().upper()
    metrics = ml_service.get_ticker_metrics(ticker_clean)

    if metrics is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Backtest metrics are not yet recorded for ticker '{ticker_clean}'. Historical evaluation is currently stored for RELIANCE.NS."
        )

    return metrics
