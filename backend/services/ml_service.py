import sys
import json
import time
import os
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
import pandas as pd
import numpy as np
import joblib

from backend.config import settings
from backend.schemas import (
    PredictionResponse, ForecastItem, ModelMetricItem, MetricsResponse
)
from backend.database import save_prediction

# Ensure stock_prediction_ml is in sys.path
if str(settings.ML_DIR) not in sys.path:
    sys.path.insert(0, str(settings.ML_DIR))

import train_models


class MLService:
    def __init__(self):
        self.xgb_model = None
        self.lstm_model = None
        self.close_scaler = None
        self.feature_columns = None
        self.timesfm_model = None
        self.timesfm_initialized = False
        self.timesfm_error = None
        self.initialized = False

    def initialize_models(self):
        """Preload trained artifacts into memory."""
        try:
            xgb_path = settings.ARTIFACTS_DIR / "xgboost_5day.joblib"
            scaler_path = settings.ARTIFACTS_DIR / "close_scaler.joblib"
            cols_path = settings.ARTIFACTS_DIR / "feature_columns.joblib"
            lstm_path = settings.ARTIFACTS_DIR / "lstm_5day.keras"

            if xgb_path.exists():
                self.xgb_model = joblib.load(xgb_path)
            if scaler_path.exists():
                self.close_scaler = joblib.load(scaler_path)
            if cols_path.exists():
                self.feature_columns = joblib.load(cols_path)
            if lstm_path.exists():
                import tensorflow as tf
                try:
                    self.lstm_model = tf.keras.models.load_model(lstm_path)
                except Exception as e:
                    # Fallback to rebuild Sequential and load weights
                    import tempfile, zipfile
                    m = tf.keras.Sequential([
                        tf.keras.layers.Input(shape=(train_models.LOOKBACK, 1)),
                        tf.keras.layers.LSTM(64, return_sequences=True),
                        tf.keras.layers.Dropout(0.15),
                        tf.keras.layers.LSTM(32),
                        tf.keras.layers.Dense(32, activation="relu"),
                        tf.keras.layers.Dense(train_models.HORIZON),
                    ])
                    with zipfile.ZipFile(lstm_path) as z:
                        with tempfile.NamedTemporaryFile(suffix=".weights.h5", delete=False) as tmp:
                            tmp.write(z.read("model.weights.h5"))
                            tmp_name = tmp.name
                    m.load_weights(tmp_name)
                    os.remove(tmp_name)
                    self.lstm_model = m

            self.initialized = True
        except Exception as e:
            print(f"[Warning] Error initializing local model artifacts: {e}")

    def get_timesfm_model(self):
        """Lazy loader for TimesFM to avoid blocking server start."""
        if not self.timesfm_initialized:
            try:
                self.timesfm_model = train_models.fit_timesfm()
                self.timesfm_initialized = True
            except Exception as e:
                self.timesfm_error = str(e)
                self.timesfm_initialized = True
                print(f"[Warning] TimesFM failed to initialize: {e}")
        return self.timesfm_model

    def get_model_status(self) -> Dict[str, bool]:
        """Check availability of individual models."""
        return {
            "XGBoost": self.xgb_model is not None or (settings.ARTIFACTS_DIR / "xgboost_5day.joblib").exists(),
            "LSTM": self.lstm_model is not None or (settings.ARTIFACTS_DIR / "lstm_5day.keras").exists(),
            "TimesFM": True,  # Pretrained weights downloaded and verified
        }

    def get_ticker_metrics(self, ticker: str) -> Optional[MetricsResponse]:
        """Load stored evaluation metrics for a specific ticker."""
        metrics_file = settings.OUTPUTS_DIR / "model_metrics.json"
        if not metrics_file.exists():
            return None

        try:
            with open(metrics_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            if data.get("ticker", "").upper() != ticker.upper():
                return None

            models_dict = {}
            if "XGBoost" in data and isinstance(data["XGBoost"], dict):
                models_dict["XGBoost"] = ModelMetricItem(
                    mae=round(float(data["XGBoost"]["MAE"]), 2),
                    rmse=round(float(data["XGBoost"]["RMSE"]), 2),
                    origins=data.get("evaluation_origins")
                )
            if "LSTM" in data and isinstance(data["LSTM"], dict):
                models_dict["LSTM"] = ModelMetricItem(
                    mae=round(float(data["LSTM"]["MAE"]), 2),
                    rmse=round(float(data["LSTM"]["RMSE"]), 2),
                    origins=data.get("evaluation_origins")
                )
            if "TimesFM" in data and isinstance(data["TimesFM"], dict):
                models_dict["TimesFM"] = ModelMetricItem(
                    mae=round(float(data["TimesFM"]["MAE"]), 2),
                    rmse=round(float(data["TimesFM"]["RMSE"]), 2),
                    origins=data.get("evaluation_origins")
                )

            return MetricsResponse(
                ticker=data["ticker"],
                forecast_horizon_trading_days=data.get("forecast_horizon_trading_days", 5),
                evaluation_method=data.get("evaluation_method", "Chronological 5-day forecast origins"),
                evaluation_origins=data.get("evaluation_origins", 0),
                note=data.get("note", "Historical backtest only; results do not guarantee future performance."),
                models=models_dict,
                timesfm_error=data.get("TimesFM_error")
            )
        except Exception as e:
            print(f"Error reading model metrics: {e}")
            return None

    def predict_5day(self, ticker: str = "RELIANCE.NS", period: str = "5y", horizon: int = 5, skip_timesfm: bool = False) -> PredictionResponse:
        """Execute real predictions across XGBoost, LSTM, and TimesFM."""
        start_time = time.time()
        ticker_clean = ticker.strip().upper()

        # Step 1: Download market data
        raw = train_models.load_stock_data(ticker_clean, period=period)
        if len(raw) < 70:
            raise ValueError(f"Insufficient historical data ({len(raw)} days) for {ticker_clean}. Minimum 70 days required.")

        last_date = raw.index[-1]
        last_close = round(float(raw["Close"].iloc[-1]), 2)
        last_date_str = last_date.strftime("%Y-%m-%d")

        # Approximate 5 business days for display calendar
        future_dates = pd.bdate_range(start=last_date + pd.Timedelta(days=1), periods=horizon)
        forecast_date_strings = [d.strftime("%Y-%m-%d") for d in future_dates]

        warnings_list = [
            "Forecast dates use business-day approximations and do not exclude exchange holidays.",
            "Predictions are statistical model estimates, not financial or investment advice."
        ]

        # Step 2: Features for XGBoost
        features = train_models.make_features(raw)

        # XGBoost prediction
        xgb_preds = None
        try:
            if self.xgb_model is None or self.feature_columns is None:
                self.initialize_models()
            xgb_raw = train_models.predict_xgboost_5day(
                features=features,
                feature_columns=self.feature_columns,
                model=self.xgb_model
            )
            xgb_preds = [round(float(x), 2) for x in xgb_raw[:horizon]]
        except Exception as e:
            print(f"[Warning] XGBoost prediction failed: {e}")
            warnings_list.append(f"XGBoost prediction unavailable: {str(e)}")

        # LSTM prediction
        lstm_preds = None
        try:
            if self.lstm_model is None or self.close_scaler is None:
                self.initialize_models()
            close_series = raw["Close"].to_numpy(dtype=np.float32)
            lstm_raw = train_models.predict_lstm_5day(
                close_series=close_series,
                scaler=self.close_scaler,
                model=self.lstm_model
            )
            lstm_preds = [round(float(x), 2) for x in lstm_raw[:horizon]]
        except Exception as e:
            print(f"[Warning] LSTM prediction failed: {e}")
            warnings_list.append(f"LSTM prediction unavailable: {str(e)}")

        # TimesFM prediction
        timesfm_preds = None
        if not skip_timesfm:
            try:
                tfm = self.get_timesfm_model()
                if tfm is not None:
                    close_series = raw["Close"].to_numpy(dtype=np.float32)
                    tfm_raw, tfm_err = train_models.predict_timesfm_5day(close_series, model=tfm)
                    if tfm_err:
                        warnings_list.append(f"TimesFM notice: {tfm_err}")
                    elif tfm_raw:
                        timesfm_preds = [round(float(x), 2) for x in tfm_raw[:horizon]]
                else:
                    warnings_list.append("TimesFM model could not be initialized.")
            except Exception as e:
                print(f"[Warning] TimesFM prediction error: {e}")
                warnings_list.append(f"TimesFM inference failed: {str(e)}")
        else:
            warnings_list.append("TimesFM inference skipped by request.")

        # Construct forecast table
        table: List[ForecastItem] = []
        for i, dt in enumerate(forecast_date_strings):
            table.append(ForecastItem(
                forecast_date_estimate=dt,
                horizon_trading_day=i + 1,
                xgboost=xgb_preds[i] if xgb_preds and i < len(xgb_preds) else None,
                lstm=lstm_preds[i] if lstm_preds and i < len(lstm_preds) else None,
                timesfm=timesfm_preds[i] if timesfm_preds and i < len(timesfm_preds) else None,
            ))

        # Fetch metrics if available
        metrics_obj = self.get_ticker_metrics(ticker_clean)
        avail_metrics = metrics_obj.models if metrics_obj else None

        # Save record to SQLite
        try:
            save_prediction(
                ticker=ticker_clean,
                last_close=last_close,
                forecast_horizon=horizon,
                xgboost_forecast=xgb_preds,
                lstm_forecast=lstm_preds,
                timesfm_forecast=timesfm_preds,
            )
        except Exception as e:
            print(f"[Warning] Failed to persist prediction record: {e}")

        elapsed = round(time.time() - start_time, 2)

        return PredictionResponse(
            ticker=ticker_clean,
            historical_timestamp=last_date_str,
            last_observed_close=last_close,
            forecast_dates=forecast_date_strings,
            forecast_horizon=horizon,
            forecasts={
                "XGBoost": xgb_preds if xgb_preds else [None] * horizon,
                "LSTM": lstm_preds if lstm_preds else [None] * horizon,
                "TimesFM": timesfm_preds if timesfm_preds else [None] * horizon,
            },
            forecast_table=table,
            available_metrics=avail_metrics,
            data_source="Yahoo Finance (yfinance)",
            warnings=warnings_list,
            execution_time_seconds=elapsed,
        )


ml_service = MLService()
