import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from backend.config import settings


def init_db():
    """Initialize SQLite tables for storing prediction records."""
    conn = sqlite3.connect(str(settings.DB_PATH))
    try:
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticker TEXT NOT NULL,
                    requested_at TEXT NOT NULL,
                    last_close REAL NOT NULL,
                    forecast_horizon INTEGER NOT NULL,
                    xgboost_forecast TEXT,
                    lstm_forecast TEXT,
                    timesfm_forecast TEXT
                )
            """)
    finally:
        conn.close()


# Ensure tables exist
init_db()


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(settings.DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn



def save_prediction(
    ticker: str,
    last_close: float,
    forecast_horizon: int,
    xgboost_forecast: Optional[List[float]],
    lstm_forecast: Optional[List[float]],
    timesfm_forecast: Optional[List[float]]
) -> int:
    """Save a forecast run into SQLite history."""
    conn = get_connection()
    try:
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        with conn:
            cursor = conn.execute(
                """
                INSERT INTO predictions (
                    ticker, requested_at, last_close, forecast_horizon,
                    xgboost_forecast, lstm_forecast, timesfm_forecast
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ticker,
                    now_str,
                    float(last_close),
                    forecast_horizon,
                    json.dumps(xgboost_forecast) if xgboost_forecast else None,
                    json.dumps(lstm_forecast) if lstm_forecast else None,
                    json.dumps(timesfm_forecast) if timesfm_forecast else None,
                )
            )
            return cursor.lastrowid
    finally:
        conn.close()


def get_recent_predictions(limit: int = 15) -> List[Dict[str, Any]]:
    """Retrieve recent prediction history."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            """
            SELECT id, ticker, requested_at, last_close, forecast_horizon,
                   xgboost_forecast, lstm_forecast, timesfm_forecast
            FROM predictions
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,)
        )
        rows = cursor.fetchall()
        results = []
        for r in rows:
            results.append({
                "id": r["id"],
                "ticker": r["ticker"],
                "requested_at": r["requested_at"],
                "last_close": r["last_close"],
                "forecast_horizon": r["forecast_horizon"],
                "xgboost_forecast": json.loads(r["xgboost_forecast"]) if r["xgboost_forecast"] else None,
                "lstm_forecast": json.loads(r["lstm_forecast"]) if r["lstm_forecast"] else None,
                "timesfm_forecast": json.loads(r["timesfm_forecast"]) if r["timesfm_forecast"] else None,
            })
        return results
    finally:
        conn.close()
