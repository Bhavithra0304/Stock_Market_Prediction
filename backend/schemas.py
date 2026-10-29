from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


# Health Schemas
class HealthResponse(BaseModel):
    status: str = "ok"
    ml_pipeline_available: bool = True
    models_available: Dict[str, bool] = Field(default_factory=dict)
    python_version: str
    device: str
    timestamp: str


# Model Information Schemas
class ModelInfo(BaseModel):
    id: str
    name: str
    category: str
    description: str
    methodology: str
    input_features: List[str]
    strengths: List[str]
    limitations: List[str]


class ModelListResponse(BaseModel):
    models: List[ModelInfo]
    count: int


# Prediction Schemas
class PredictionRequest(BaseModel):
    ticker: str = Field(default="RELIANCE.NS", description="Yahoo Finance stock ticker symbol")
    period: str = Field(default="5y", description="Historical period for training/context: 1y, 2y, 5y, 10y")
    horizon: int = Field(default=5, ge=1, le=10, description="Forecast horizon in trading days")
    skip_timesfm: bool = Field(default=False, description="Optionally skip TimesFM inference")

    @field_validator("ticker")
    @classmethod
    def validate_ticker(cls, v: str) -> str:
        cleaned = v.strip().upper()
        if not cleaned:
            raise ValueError("Ticker symbol cannot be empty")
        if len(cleaned) > 20:
            raise ValueError("Ticker symbol is too long")
        return cleaned

    @field_validator("period")
    @classmethod
    def validate_period(cls, v: str) -> str:
        allowed = {"1y", "2y", "5y", "10y", "max"}
        if v.lower() not in allowed:
            raise ValueError(f"Period must be one of: {', '.join(allowed)}")
        return v.lower()


class ForecastItem(BaseModel):
    forecast_date_estimate: str
    horizon_trading_day: int
    xgboost: Optional[float] = None
    lstm: Optional[float] = None
    timesfm: Optional[float] = None


class ModelMetricItem(BaseModel):
    mae: float
    rmse: float
    origins: Optional[int] = None


class PredictionResponse(BaseModel):
    ticker: str
    historical_timestamp: str
    last_observed_close: float
    forecast_dates: List[str]
    forecast_horizon: int
    forecasts: Dict[str, List[Optional[float]]]
    forecast_table: List[ForecastItem]
    available_metrics: Optional[Dict[str, ModelMetricItem]] = None
    data_source: str = "Yahoo Finance (yfinance)"
    warnings: List[str] = Field(default_factory=list)
    execution_time_seconds: float


# Historical Data Schemas
class HistoricalSummary(BaseModel):
    ticker: str
    latest_close: float
    previous_close: float
    change: float
    change_percent: float
    high_52w: float
    low_52w: float
    volume: int
    last_date: str


class HistoricalDataPoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class HistoricalDataResponse(BaseModel):
    ticker: str
    period: str
    interval: str
    data_source: str
    last_updated: str
    summary: HistoricalSummary
    data: List[HistoricalDataPoint]


# Metrics Schema
class MetricsResponse(BaseModel):
    ticker: str
    forecast_horizon_trading_days: int
    evaluation_method: str
    evaluation_origins: int
    note: str
    models: Dict[str, ModelMetricItem]
    timesfm_error: Optional[str] = None


# Prediction Record Schema
class PredictionRecord(BaseModel):
    id: int
    ticker: str
    requested_at: str
    last_close: float
    forecast_horizon: int
    xgboost_forecast: Optional[List[float]] = None
    lstm_forecast: Optional[List[float]] = None
    timesfm_forecast: Optional[List[float]] = None
