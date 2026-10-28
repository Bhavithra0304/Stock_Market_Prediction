"""
5-trading-day stock forecasting: XGBoost + LSTM + TimesFM 2.5
Educational project. Forecasts are estimates, not financial advice.
"""

import argparse
import json
import os
import warnings
from pathlib import Path

# pyrefly: ignore[missing-import]
import joblib
# pyrefly: ignore[missing-import]
import matplotlib
matplotlib.use("Agg")
# pyrefly: ignore[missing-import]
import matplotlib.pyplot as plt
# pyrefly: ignore[missing-import]
import numpy as np
# pyrefly: ignore[missing-import]
import pandas as pd
# pyrefly: ignore[missing-import]
import yfinance as yf
from sklearn.multioutput import MultiOutputRegressor
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
# pyrefly: ignore[missing-import]
from xgboost import XGBRegressor

BASE_DIR = Path(__file__).resolve().parent
ARTIFACTS = BASE_DIR / "artifacts"
OUTPUTS = BASE_DIR / "outputs"
HORIZON = 5
LOOKBACK = 60
RANDOM_STATE = 42
EVALUATION_STEP = 5
TRAIN_RATIO = 0.80


def load_stock_data(ticker: str, period: str = "5y") -> pd.DataFrame:
    """Download daily historical data and normalize yfinance's column format."""
    df = yf.download(ticker, period=period, interval="1d", auto_adjust=True,
                     progress=False, threads=False)
    if df.empty:
        raise ValueError(f"No data returned for ticker '{ticker}'. Check the symbol or internet connection.")

    # yfinance may return MultiIndex columns, depending on version/ticker.
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    required = ["Open", "High", "Low", "Close", "Volume"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Downloaded data is missing columns: {missing}")

    df = df[required].copy()
    df.index = pd.to_datetime(df.index)
    if getattr(df.index, "tz", None) is not None:
        df.index = df.index.tz_localize(None)
    df = df[~df.index.duplicated(keep="last")].sort_index()
    df = df.replace([np.inf, -np.inf], np.nan).dropna()
    if len(df) < 300:
        warnings.warn("Fewer than 300 observations were downloaded; model evaluation may be unstable.")
    return df


def make_features(raw: pd.DataFrame) -> pd.DataFrame:
    """Create features using current and past data only."""
    f = raw.copy()
    close = f["Close"]
    f["return_1d"] = close.pct_change()
    f["return_5d"] = close.pct_change(5)
    f["return_10d"] = close.pct_change(10)
    for window in (5, 10, 20, 50):
        f[f"sma_{window}"] = close.rolling(window).mean()
        f[f"close_vs_sma_{window}"] = close / f[f"sma_{window}"] - 1.0
    f["volatility_10d"] = f["return_1d"].rolling(10).std()
    f["volatility_20d"] = f["return_1d"].rolling(20).std()

    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rs = gain / loss.replace(0, np.nan)
    f["rsi_14"] = 100 - (100 / (1 + rs))
    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    f["macd"] = ema12 - ema26
    f["macd_signal"] = f["macd"].ewm(span=9, adjust=False).mean()
    f["volume_change"] = f["Volume"].pct_change().replace([np.inf, -np.inf], np.nan)
    return f.replace([np.inf, -np.inf], np.nan)


def make_supervised(features: pd.DataFrame, close: pd.Series):
    """At date t, use features available at t to predict closes t+1 ... t+5."""
    data = features.copy()
    for h in range(1, HORIZON + 1):
        data[f"target_{h}"] = close.shift(-h)
    data = data.dropna()
    target_cols = [f"target_{h}" for h in range(1, HORIZON + 1)]
    X = data.drop(columns=target_cols)
    y = data[target_cols]
    return X, y, data.index


def make_lstm_windows(close_values: np.ndarray, lookback: int, horizon: int):
    X, y, positions = [], [], []
    for end in range(lookback - 1, len(close_values) - horizon):
        X.append(close_values[end - lookback + 1:end + 1])
        y.append(close_values[end + 1:end + 1 + horizon])
        positions.append(end)
    return np.asarray(X), np.asarray(y), np.asarray(positions)


def calculate_metrics(y_true, y_pred):
    """Calculate MAE and RMSE over the same flattened forecast targets."""
    return {
        "MAE": float(mean_absolute_error(np.asarray(y_true).ravel(), np.asarray(y_pred).ravel())),
        "RMSE": float(np.sqrt(mean_squared_error(np.asarray(y_true).ravel(), np.asarray(y_pred).ravel()))),
    }


def get_common_test_origins(
    number_of_rows: int,
    split_position: int,
    lookback: int = LOOKBACK,
    horizon: int = HORIZON,
    step: int = EVALUATION_STEP,
):
    """Historical forecast origins shared by XGBoost, LSTM, and TimesFM.

    An origin is the final row visible to a model. The target is the next
    `horizon` closing prices, so no future target values are given as input.
    """
    origins = range(split_position - 1, number_of_rows - horizon, step)
    return [pos for pos in origins if pos >= lookback - 1]


def fit_timesfm():
    """Load pretrained TimesFM 2.5. This is inference, not training from scratch."""
    import torch
    import timesfm

    torch.set_float32_matmul_precision("high")
    model = timesfm.TimesFM_2p5_200M_torch.from_pretrained(
        "google/timesfm-2.5-200m-pytorch"
    )
    model.compile(timesfm.ForecastConfig(
        max_context=1024,
        max_horizon=HORIZON,
        normalize_inputs=True,
        use_continuous_quantile_head=True,
        force_flip_invariance=True,
        infer_is_positive=True,
        fix_quantile_crossing=True,
    ))
    return model


def predict_xgboost_5day(features: pd.DataFrame, feature_columns: list, model=None, model_path: Path = None) -> list:
    """Generate 5-day prediction using trained XGBoost MultiOutputRegressor."""
    if model is None:
        path = model_path or (ARTIFACTS / "xgboost_5day.joblib")
        model = joblib.load(path)
    latest_features = features.dropna().iloc[[-1]][feature_columns]
    pred = model.predict(latest_features)[0].tolist()
    return [float(x) for x in pred]


def predict_lstm_5day(close_series: np.ndarray, scaler=None, model=None, artifacts_dir: Path = None) -> list:
    """Generate 5-day prediction using trained LSTM model."""
    adir = artifacts_dir or ARTIFACTS
    if scaler is None:
        scaler = joblib.load(adir / "close_scaler.joblib")
    if model is None:
        import tensorflow as tf
        try:
            model = tf.keras.models.load_model(adir / "lstm_5day.keras")
        except Exception:
            import tempfile, zipfile, os
            m = tf.keras.Sequential([
                tf.keras.layers.Input(shape=(LOOKBACK, 1)),
                tf.keras.layers.LSTM(64, return_sequences=True),
                tf.keras.layers.Dropout(0.15),
                tf.keras.layers.LSTM(32),
                tf.keras.layers.Dense(32, activation="relu"),
                tf.keras.layers.Dense(HORIZON),
            ])
            with zipfile.ZipFile(adir / "lstm_5day.keras") as z:
                with tempfile.NamedTemporaryFile(suffix=".weights.h5", delete=False) as tmp:
                    tmp.write(z.read("model.weights.h5"))
                    tmp_name = tmp.name
            m.load_weights(tmp_name)
            os.remove(tmp_name)
            model = m

    close_vals = np.asarray(close_series, dtype=np.float32).reshape(-1, 1)
    scaled = scaler.transform(close_vals).astype(np.float32).ravel()
    latest_scaled = scaled[-LOOKBACK:]
    lstm_scaled_future = model.predict(latest_scaled.reshape(1, LOOKBACK, 1), verbose=0)[0]
    lstm_future = scaler.inverse_transform(lstm_scaled_future.reshape(-1, 1)).ravel().tolist()
    return [float(x) for x in lstm_future]


def predict_timesfm_5day(close_series: np.ndarray, model=None):
    """Generate 5-day point forecast using TimesFM pretrained model."""
    try:
        if model is None:
            model = fit_timesfm()
        c_series = np.asarray(close_series, dtype=np.float32)
        point, quantiles = model.forecast(
            horizon=HORIZON,
            inputs=[c_series]
        )
        future = point[0, :HORIZON].astype(float).tolist()
        return [float(x) for x in future], None
    except Exception as exc:
        return None, f"{type(exc).__name__}: {exc}"


def run_pipeline(ticker: str = "RELIANCE.NS", period: str = "5y", skip_timesfm: bool = False, save_artifacts: bool = True):
    """Run full training, backtest evaluation, and 5-day future forecasting pipeline."""
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    OUTPUTS.mkdir(parents=True, exist_ok=True)

    print(f"[1/7] Downloading {ticker} history...")
    raw = load_stock_data(ticker, period)
    if save_artifacts:
        raw.to_csv(OUTPUTS / "historical_data.csv")

    print("[2/7] Creating technical indicators and supervised targets...")
    features = make_features(raw)
    X, y, target_dates = make_supervised(features, raw["Close"])
    if len(X) < 250:
        raise ValueError("Not enough usable rows. Try a longer --period (e.g. 5y).")

    # One chronological split based on raw observations is shared by all models.
    raw_split = int(len(raw) * TRAIN_RATIO)
    common_origins = get_common_test_origins(len(raw), raw_split)
    if not common_origins:
        raise ValueError("Not enough held-out rows to evaluate the models.")

    raw_positions_for_X = raw.index.get_indexer(X.index)
    train_mask = (raw_positions_for_X >= 0) & (raw_positions_for_X < raw_split - HORIZON)
    X_train, y_train = X.loc[train_mask], y.loc[train_mask]
    if len(X_train) < 100:
        raise ValueError("Not enough training rows after the chronological split.")

    common_origin_dates = raw.index[common_origins]
    X_test_common = X.loc[common_origin_dates]
    actual_common = np.stack([
        raw["Close"].to_numpy(dtype=np.float32)[pos + 1:pos + 1 + HORIZON]
        for pos in common_origins
    ])
    feature_columns = list(X.columns)
    if save_artifacts:
        joblib.dump(feature_columns, ARTIFACTS / "feature_columns.joblib")

    print("[3/7] Training XGBoost (multi-output, 5-day direct forecast)...")
    xgb = MultiOutputRegressor(XGBRegressor(
        n_estimators=450,
        max_depth=4,
        learning_rate=0.03,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="reg:squarederror",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    ))
    xgb.fit(X_train, y_train)
    if save_artifacts:
        joblib.dump(xgb, ARTIFACTS / "xgboost_5day.joblib")
    xgb_test_pred = xgb.predict(X_test_common)

    print("[4/7] Training LSTM (sequence-to-5-day forecast)...")
    close_values = raw["Close"].to_numpy(dtype=np.float32).reshape(-1, 1)
    scaler = MinMaxScaler()
    scaler.fit(close_values[:raw_split])
    scaled = scaler.transform(close_values).astype(np.float32).ravel()
    X_seq, y_seq, end_positions = make_lstm_windows(scaled, LOOKBACK, HORIZON)
    seq_train_mask = end_positions < raw_split - HORIZON
    seq_test_mask = np.isin(end_positions, common_origins)
    X_lstm_train, y_lstm_train = X_seq[seq_train_mask], y_seq[seq_train_mask]
    X_lstm_test = X_seq[seq_test_mask]

    try:
        import tensorflow as tf
    except ImportError as exc:
        raise ImportError("TensorFlow is missing. Install requirements.txt before running.") from exc

    tf.keras.utils.set_random_seed(RANDOM_STATE)
    lstm = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(LOOKBACK, 1)),
        tf.keras.layers.LSTM(64, return_sequences=True),
        tf.keras.layers.Dropout(0.15),
        tf.keras.layers.LSTM(32),
        tf.keras.layers.Dense(32, activation="relu"),
        tf.keras.layers.Dense(HORIZON),
    ])
    lstm.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001), loss="mse")
    early_stop = tf.keras.callbacks.EarlyStopping(
        monitor="val_loss", patience=8, restore_best_weights=True
    )
    lstm.fit(
        X_lstm_train[..., np.newaxis], y_lstm_train,
        epochs=60, batch_size=32, validation_split=0.1,
        callbacks=[early_stop], verbose=1, shuffle=False,
    )
    if save_artifacts:
        lstm.save(ARTIFACTS / "lstm_5day.keras")
        joblib.dump(scaler, ARTIFACTS / "close_scaler.joblib")
    lstm_scaled_pred = lstm.predict(X_lstm_test[..., np.newaxis], verbose=0)
    lstm_pred = scaler.inverse_transform(lstm_scaled_pred.reshape(-1, 1)).reshape(-1, HORIZON)
    lstm_metrics = calculate_metrics(actual_common, lstm_pred)

    print("[5/7] Evaluating XGBoost and LSTM on the same held-out forecast origins...")
    xgb_metrics = calculate_metrics(actual_common, xgb_test_pred)
    metrics = {
        "ticker": ticker,
        "forecast_horizon_trading_days": HORIZON,
        "evaluation_method": "All models evaluated on the same chronological 5-day forecast origins.",
        "evaluation_origins": len(common_origins),
        "note": "Historical backtest only; results do not guarantee future performance.",
        "XGBoost": xgb_metrics,
        "LSTM": lstm_metrics,
    }

    latest_features = features.dropna().iloc[[-1]][feature_columns]
    xgb_future = xgb.predict(latest_features)[0].tolist()
    latest_scaled = scaled[-LOOKBACK:]
    lstm_scaled_future = lstm.predict(latest_scaled.reshape(1, LOOKBACK, 1), verbose=0)[0]
    lstm_future = scaler.inverse_transform(lstm_scaled_future.reshape(-1, 1)).ravel().tolist()

    print("[6/7] Loading TimesFM and evaluating its five-day forecast...")
    timesfm_future = None
    timesfm_error = None
    if not skip_timesfm:
        try:
            tfm = fit_timesfm()
            close_series = raw["Close"].to_numpy(dtype=np.float32)
            tfm_pred = []
            for origin in common_origins:
                point, _ = tfm.forecast(
                    horizon=HORIZON,
                    inputs=[close_series[:origin + 1].astype(np.float32)]
                )
                tfm_pred.append(point[0, :HORIZON])
            metrics["TimesFM"] = calculate_metrics(actual_common, np.asarray(tfm_pred))
            point, quantiles = tfm.forecast(
                horizon=HORIZON,
                inputs=[close_series.astype(np.float32)]
            )
            timesfm_future = point[0, :HORIZON].astype(float).tolist()
        except Exception as exc:
            timesfm_error = f"{type(exc).__name__}: {exc}"
            warnings.warn(f"TimesFM could not run: {exc}. XGBoost and LSTM outputs are still available.")
    else:
        timesfm_error = "Skipped by user flag or parameter"

    print("[7/7] Saving forecast and evaluation files...")
    last_date = raw.index[-1]
    future_dates = pd.bdate_range(start=last_date + pd.Timedelta(days=1), periods=HORIZON)
    forecast = pd.DataFrame({
        "forecast_date_estimate": [d.strftime("%Y-%m-%d") for d in future_dates],
        "horizon_trading_day": list(range(1, HORIZON + 1)),
        "XGBoost": xgb_future,
        "LSTM": lstm_future,
        "TimesFM": timesfm_future if timesfm_future is not None else [None] * HORIZON,
    })

    metrics["TimesFM_error"] = timesfm_error
    if save_artifacts:
        forecast.to_csv(OUTPUTS / "next_5_day_forecast.csv", index=False)
        with open(OUTPUTS / "model_metrics.json", "w", encoding="utf-8") as f:
            json.dump(metrics, f, indent=2)

        plt.figure(figsize=(12, 6))
        history = raw["Close"].tail(90)
        plt.plot(history.index, history.values, label="Historical close")
        for model_name in ("XGBoost", "LSTM", "TimesFM"):
            if forecast[model_name].notna().all():
                plt.plot(future_dates, forecast[model_name].values, marker="o", label=f"{model_name} forecast")
        plt.title(f"{ticker}: next 5 trading-day forecast (estimates)")
        plt.xlabel("Date")
        plt.ylabel("Adjusted close price")
        plt.legend()
        plt.tight_layout()
        plt.savefig(OUTPUTS / "forecast_chart.png", dpi=150)
        plt.close()

    return {
        "ticker": ticker,
        "last_date": last_date.strftime("%Y-%m-%d"),
        "last_close": float(raw["Close"].iloc[-1]),
        "forecast": forecast.to_dict(orient="records"),
        "metrics": metrics,
    }


def main():
    parser = argparse.ArgumentParser(description="Train/evaluate 5-day stock forecasting models.")
    parser.add_argument("--ticker", default="RELIANCE.NS", help="Yahoo Finance ticker, e.g. RELIANCE.NS or AAPL")
    parser.add_argument("--period", default="5y", help="History period accepted by yfinance, e.g. 2y, 5y, 10y")
    parser.add_argument("--skip-timesfm", action="store_true", help="Skip TimesFM if memory/install requirements are an issue")
    args = parser.parse_args()

    result = run_pipeline(ticker=args.ticker, period=args.period, skip_timesfm=args.skip_timesfm, save_artifacts=True)

    print("\nCompleted.")
    print(f"Forecast: {OUTPUTS / 'next_5_day_forecast.csv'}")
    print(f"Metrics:  {OUTPUTS / 'model_metrics.json'}")
    print(f"Chart:    {OUTPUTS / 'forecast_chart.png'}")
    print(json.dumps(result["metrics"], indent=2))
    print("\nForecast table:")
    print(pd.DataFrame(result["forecast"]).to_string(index=False))


if __name__ == "__main__":
    main()
