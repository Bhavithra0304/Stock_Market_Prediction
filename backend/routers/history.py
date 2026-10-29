from fastapi import APIRouter, HTTPException, Query, status
from backend.schemas import HistoricalDataResponse
from backend.services.data_service import get_historical_market_data

router = APIRouter(prefix="/api", tags=["Historical Data"])


@router.get("/history/{ticker}", response_model=HistoricalDataResponse)
def get_stock_history(
    ticker: str,
    period: str = Query(default="1y", description="Time period: 1mo, 3mo, 6mo, 1y, 2y, 5y, max"),
    interval: str = Query(default="1d", description="Data interval: 1d, 1wk, 1mo")
):
    """Retrieve historical daily OHLCV market data and summary stats for a ticker."""
    ticker_clean = ticker.strip().upper()
    if not ticker_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock ticker symbol cannot be empty."
        )

    allowed_periods = {"1mo", "3mo", "6mo", "1y", "2y", "5y", "max"}
    if period.lower() not in allowed_periods:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid period '{period}'. Allowed periods: {', '.join(allowed_periods)}"
        )

    try:
        data = get_historical_market_data(ticker=ticker_clean, period=period.lower(), interval=interval.lower())
        return data
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve)
        )
    except Exception as e:
        print(f"[Error in /api/history/{ticker}] {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve historical data from provider."
        )
