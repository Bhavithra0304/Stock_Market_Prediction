export interface HealthResponse {
  status: string;
  ml_pipeline_available: boolean;
  models_available: Record<string, boolean>;
  python_version: string;
  device: string;
  timestamp: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  methodology: string;
  input_features: string[];
  strengths: string[];
  limitations: string[];
}

export interface ModelListResponse {
  models: ModelInfo[];
  count: number;
}

export interface PredictionRequest {
  ticker: string;
  period?: string;
  horizon?: number;
  skip_timesfm?: boolean;
}

export interface ForecastItem {
  forecast_date_estimate: string;
  horizon_trading_day: number;
  xgboost: number | null;
  lstm: number | null;
  timesfm: number | null;
}

export interface ModelMetricItem {
  mae: number;
  rmse: number;
  origins?: number | null;
}

export interface PredictionResponse {
  ticker: string;
  historical_timestamp: string;
  last_observed_close: number;
  forecast_dates: string[];
  forecast_horizon: number;
  forecasts: {
    XGBoost: (number | null)[];
    LSTM: (number | null)[];
    TimesFM: (number | null)[];
  };
  forecast_table: ForecastItem[];
  available_metrics?: Record<string, ModelMetricItem> | null;
  data_source: string;
  warnings: string[];
  execution_time_seconds: number;
}

export interface HistoricalSummary {
  ticker: string;
  latest_close: number;
  previous_close: number;
  change: number;
  change_percent: number;
  high_52w: number;
  low_52w: number;
  volume: number;
  last_date: string;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalDataResponse {
  ticker: string;
  period: string;
  interval: string;
  data_source: string;
  last_updated: string;
  summary: HistoricalSummary;
  data: HistoricalDataPoint[];
}

export interface MetricsResponse {
  ticker: string;
  forecast_horizon_trading_days: number;
  evaluation_method: string;
  evaluation_origins: number;
  note: string;
  models: Record<string, ModelMetricItem>;
  timesfm_error?: string | null;
}

export interface PredictionRecord {
  id: number;
  ticker: string;
  requested_at: string;
  last_close: number;
  forecast_horizon: number;
  xgboost_forecast?: number[] | null;
  lstm_forecast?: number[] | null;
  timesfm_forecast?: number[] | null;
}
