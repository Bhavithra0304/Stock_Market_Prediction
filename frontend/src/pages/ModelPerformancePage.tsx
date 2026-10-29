import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  BarChart3,
  Trophy,
  BrainCircuit,
  ArrowRight,
} from "lucide-react";
import { apiService, formatApiError } from "../services/api";
import type { MetricsResponse } from "../types";
import { ErrorAlert } from "../components/ErrorAlert";
import { ModelBadge } from "../components/ModelBadge";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { CustomTooltip } from "../components/ChartTooltip";

export const ModelPerformancePage: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPerformance = async () => {
      setLoading(true);
      setError(null);
      try {
        const metRes = await apiService.getModelMetrics("RELIANCE.NS");
        setMetrics(metRes);
      } catch (err) {
        setError(formatApiError(err));
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, []);

  // Determine best performer dynamically based on lowest MAE from actual metrics
  const bestPerformer = React.useMemo(() => {
    if (!metrics?.models) return null;
    const entries = Object.entries(metrics.models);
    if (!entries.length) return null;

    let best = entries[0];
    for (const curr of entries) {
      if (curr[1].mae < best[1].mae) {
        best = curr;
      }
    }
    return { name: best[0], mae: best[1].mae, rmse: best[1].rmse };
  }, [metrics]);

  const barChartData = React.useMemo(() => {
    if (!metrics?.models) return [];
    return Object.entries(metrics.models).map(([mName, data]) => ({
      model: mName,
      MAE: data.mae,
      RMSE: data.rmse,
    }));
  }, [metrics]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 card-shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Backtest Evaluation Benchmarks</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Model Performance & Error Metrics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Comparison of Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE) across identical 5-day chronological forecast origins.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {bestPerformer && (
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                    Top Benchmark Performer
                  </span>
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="text-emerald-700">{bestPerformer.name}</span>
                    <span className="text-xs text-slate-500 font-mono font-normal">
                      (MAE: ₹{bestPerformer.mae.toFixed(2)})
                    </span>
                  </span>
                </div>
              </div>
            )}

            <Link
              to="/predict"
              className="inline-flex items-center gap-1.5 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-sm transition"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Predict Live Stock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => window.location.reload()} />}

      {/* Model Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={3} />
          <CardSkeleton rows={3} />
        </div>
      ) : metrics?.models ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* XGBoost Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 card-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <ModelBadge model="XGBoost" />
                <span className="text-xs font-mono text-slate-400">Gradient Boosted</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">XGBoost Regressor</h3>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    MAE (Mean Absolute Error)
                  </span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    ₹{metrics.models.XGBoost?.mae?.toFixed(2) || "N/A"}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    RMSE (Root Mean Sq.)
                  </span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    ₹{metrics.models.XGBoost?.rmse?.toFixed(2) || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Origins: {metrics.evaluation_origins}</span>
              <span className="text-indigo-600 font-semibold font-mono">5-day Horizon</span>
            </div>
          </div>

          {/* LSTM Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 card-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <ModelBadge model="LSTM" />
                <span className="text-xs font-mono text-slate-400">Recurrent Net</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">LSTM Neural Network</h3>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    MAE (Mean Absolute Error)
                  </span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    ₹{metrics.models.LSTM?.mae?.toFixed(2) || "N/A"}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    RMSE (Root Mean Sq.)
                  </span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    ₹{metrics.models.LSTM?.rmse?.toFixed(2) || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Origins: {metrics.evaluation_origins}</span>
              <span className="text-amber-600 font-semibold font-mono">60-day Lookback</span>
            </div>
          </div>

          {/* TimesFM Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 card-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <ModelBadge model="TimesFM" />
                <span className="text-xs font-mono text-slate-400">Foundation</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">TimesFM 2.5 (Google)</h3>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    MAE (Mean Absolute Error)
                  </span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    ₹{metrics.models.TimesFM?.mae?.toFixed(2) || "N/A"}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    RMSE (Root Mean Sq.)
                  </span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    ₹{metrics.models.TimesFM?.rmse?.toFixed(2) || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Origins: {metrics.evaluation_origins}</span>
              <span className="text-emerald-600 font-semibold font-mono">Zero-Shot 200M</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Comparison Chart: MAE & RMSE Side by Side */}
      {barChartData.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 card-shadow space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Benchmark Error Comparison (Lower is Better)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated across identical chronological origins without data leakage.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Units: ₹ per share
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="model"
                  tick={{ fontSize: 12, fill: "#334155", fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b", fontFamily: "monospace" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar dataKey="MAE" name="MAE (Absolute Error)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="RMSE" name="RMSE (Penalizes Outliers)" fill="#64748b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
