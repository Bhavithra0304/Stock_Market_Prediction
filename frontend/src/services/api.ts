import axios, { AxiosError } from "axios";
import type {
  HealthResponse,
  ModelListResponse,
  PredictionRequest,
  PredictionResponse,
  HistoricalDataResponse,
  MetricsResponse,
  PredictionRecord,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // 90 seconds timeout for TimesFM foundation model inference
  headers: {
    "Content-Type": "application/json",
  },
});

export function formatApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ detail?: string }>;
    if (axiosErr.response?.data?.detail) {
      return axiosErr.response.data.detail;
    }
    if (axiosErr.code === "ECONNABORTED") {
      return "Request timed out while running ML foundation inference. Try skipping TimesFM for faster XGBoost/LSTM execution.";
    }
    if (axiosErr.message === "Network Error") {
      return `Cannot connect to StockStreak backend at ${API_BASE_URL}. Ensure FastAPI is running on port 8000.`;
    }
    return axiosErr.message || "An unexpected network error occurred.";
  }
  return error instanceof Error ? error.message : "An unknown error occurred.";
}

export const apiService = {
  async getHealth(): Promise<HealthResponse> {
    const res = await apiClient.get<HealthResponse>("/api/health");
    return res.data;
  },

  async getModels(): Promise<ModelListResponse> {
    const res = await apiClient.get<ModelListResponse>("/api/models");
    return res.data;
  },

  async generatePrediction(params: PredictionRequest): Promise<PredictionResponse> {
    const res = await apiClient.post<PredictionResponse>("/api/predict", params);
    return res.data;
  },

  async getHistoricalData(
    ticker: string,
    period: string = "1y",
    interval: string = "1d"
  ): Promise<HistoricalDataResponse> {
    const res = await apiClient.get<HistoricalDataResponse>(
      `/api/history/${encodeURIComponent(ticker)}`,
      {
        params: { period, interval },
      }
    );
    return res.data;
  },

  async getModelMetrics(ticker: string): Promise<MetricsResponse> {
    const res = await apiClient.get<MetricsResponse>(
      `/api/metrics/${encodeURIComponent(ticker)}`
    );
    return res.data;
  },

  async getPredictionHistory(): Promise<PredictionRecord[]> {
    const res = await apiClient.get<PredictionRecord[]>("/api/predictions");
    return res.data;
  },
};
