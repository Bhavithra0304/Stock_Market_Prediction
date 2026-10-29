from fastapi import APIRouter
from backend.schemas import ModelListResponse, ModelInfo

router = APIRouter(prefix="/api", tags=["Models"])

SUPPORTED_MODELS = [
    ModelInfo(
        id="xgboost",
        name="XGBoost",
        category="Supervised Multi-Output Regression",
        description="Gradient boosting model engineered to predict 5 trading days simultaneously using technical indicators and price action.",
        methodology="Constructs 450 decision trees optimizing squared error with subsampling and feature regularization over 22 engineered technical features.",
        input_features=[
            "Open", "High", "Low", "Close", "Volume",
            "return_1d", "return_5d", "return_10d",
            "sma_5", "close_vs_sma_5", "sma_10", "close_vs_sma_10",
            "sma_20", "close_vs_sma_20", "sma_50", "close_vs_sma_50",
            "volatility_10d", "volatility_20d", "rsi_14",
            "macd", "macd_signal", "volume_change"
        ],
        strengths=[
            "Excellent tabular feature representation",
            "Fast deterministic inference",
            "Built-in feature regularization preventing overfitting",
            "Simultaneous 5-day multi-target forecasting"
        ],
        limitations=[
            "Does not naturally capture deep sequential recurrence",
            "Tree splits cannot extrapolate values outside historical price bounds"
        ]
    ),
    ModelInfo(
        id="lstm",
        name="LSTM (Long Short-Term Memory)",
        category="Deep Recurrent Neural Network",
        description="Deep recurrent network specialized in modeling temporal dependencies from 60-day closing price sequence windows.",
        methodology="Two-stage stacked LSTM (64 units -> 15% dropout -> 32 units) followed by Dense layers trained with Adam optimizer and early stopping on normalized prices.",
        input_features=["60-day normalized closing price sequence"],
        strengths=[
            "Captures non-linear temporal dynamics and momentum",
            "Gating mechanisms selectively remember long-term context",
            "Effective on continuous univariate price series"
        ],
        limitations=[
            "Higher sensitivity to non-stationary market regimes",
            "Requires careful feature scaling and normalization",
            "Higher training overhead than gradient boosting"
        ]
    ),
    ModelInfo(
        id="timesfm",
        name="TimesFM 2.5 (Google Research)",
        category="Pretrained Time-Series Foundation Model",
        description="200-million parameter pretrained transformer foundation model developed by Google for zero-shot time series forecasting.",
        methodology="Pretrained on over 100 billion real-world time points with patched self-attention, input normalization, and continuous quantile heads.",
        input_features=["Historical closing price series context"],
        strengths=[
            "Zero-shot forecasting without needing local model retraining",
            "Pretrained across massive cross-domain time-series datasets",
            "Advanced patch-based attention mechanism for global patterns"
        ],
        limitations=[
            "Computationally intensive CPU/GPU inference requirements",
            "Black-box transformer representation with complex weight dependencies"
        ]
    )
]


@router.get("/models", response_model=ModelListResponse)
def get_models():
    """Return the three supported machine learning models and their methodologies."""
    return ModelListResponse(
        models=SUPPORTED_MODELS,
        count=len(SUPPORTED_MODELS)
    )
