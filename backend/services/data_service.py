import time
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np
import yfinance as yf
from backend.config import settings
from backend.schemas import HistoricalDataResponse, HistoricalSummary, HistoricalDataPoint

# In-memory cache for historical data: key -> (timestamp, data)
_CACHE: Dict[str, tuple[float, HistoricalDataResponse]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes cache


def fetch_raw_stock_data(ticker: str, period: str = "1y", interval: str = "1d") -> pd.DataFrame:
    """Download daily historical data and normalize yfinance's column format."""
    df = yf.download(
        ticker,
        period=period,
        interval=interval,
        auto_adjust=True,
        progress=False,
        threads=False
    )

    if df.empty:
        # Fallback for RELIANCE.NS if cached historical_data.csv exists
        if ticker.upper() == "RELIANCE.NS" and (settings.OUTPUTS_DIR / "historical_data.csv").exists():
            df = pd.read_csv(settings.OUTPUTS_DIR / "historical_data.csv", index_col=0, parse_dates=True)
        else:
            raise ValueError(f"No market data returned for ticker '{ticker}'. Please verify the symbol.")

    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    required = ["Open", "High", "Low", "Close", "Volume"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Market data is missing required columns: {missing}")

    df = df[required].copy()
    df.index = pd.to_datetime(df.index)
    if getattr(df.index, "tz", None) is not None:
        df.index = df.index.tz_localize(None)
    df = df[~df.index.duplicated(keep="last")].sort_index()
    df = df.replace([np.inf, -np.inf], np.nan).dropna()
    return df


def get_historical_market_data(ticker: str, period: str = "1y", interval: str = "1d") -> HistoricalDataResponse:
    """Get historical OHLCV data with metrics summary and caching."""
    cache_key = f"{ticker.upper()}:{period}:{interval}"
    now = time.time()

    if cache_key in _CACHE:
        cached_time, cached_resp = _CACHE[cache_key]
        if now - cached_time < CACHE_TTL_SECONDS:
            return cached_resp

    df = fetch_raw_stock_data(ticker, period=period, interval=interval)
    if len(df) == 0:
        raise ValueError(f"No price records found for {ticker}")

    # Build data points
    points = []
    for dt, row in df.iterrows():
        points.append(
            HistoricalDataPoint(
                date=dt.strftime("%Y-%m-%d"),
                open=round(float(row["Open"]), 2),
                high=round(float(row["High"]), 2),
                low=round(float(row["Low"]), 2),
                close=round(float(row["Close"]), 2),
                volume=int(row["Volume"]),
            )
        )

    # Compute summary stats
    latest = df.iloc[-1]
    prev = df.iloc[-2] if len(df) > 1 else latest
    latest_close = round(float(latest["Close"]), 2)
    prev_close = round(float(prev["Close"]), 2)
    change = round(latest_close - prev_close, 2)
    change_pct = round((change / prev_close) * 100, 2) if prev_close != 0 else 0.0

    # 52-week high and low from downloaded period or subset
    high_52w = round(float(df["High"].max()), 2)
    low_52w = round(float(df["Low"].min()), 2)
    avg_vol = int(df["Volume"].mean())

    summary = HistoricalSummary(
        ticker=ticker.upper(),
        latest_close=latest_close,
        previous_close=prev_close,
        change=change,
        change_percent=change_pct,
        high_52w=high_52w,
        low_52w=low_52w,
        volume=avg_vol,
        last_date=df.index[-1].strftime("%Y-%m-%d"),
    )

    response = HistoricalDataResponse(
        ticker=ticker.upper(),
        period=period,
        interval=interval,
        data_source="Yahoo Finance (yfinance)",
        last_updated=df.index[-1].strftime("%Y-%m-%d"),
        summary=summary,
        data=points,
    )

    _CACHE[cache_key] = (now, response)
    return response
