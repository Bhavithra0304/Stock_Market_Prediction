import React, { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  BrainCircuit,
  Sparkles,
  Clock,
  TrendingUp,
  Eye,
  EyeOff,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { apiService, formatApiError } from "../services/api";
import type { PredictionResponse } from "../types";
import { StockSearch } from "../components/StockSearch";
import { ErrorAlert } from "../components/ErrorAlert";
import { CustomTooltip } from "../components/ChartTooltip";
import { CardSkeleton, ChartSkeleton } from "../components/LoadingSkeleton";
import { useStock } from "../context/StockContext";

export const PredictionPage: React.FC = () => {
  const { selectedTicker, setSelectedTicker } = useStock();
  const [period, setPeriod] = useState("5y");
  const [skipTimesfm, setSkipTimesfm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Visibility toggles for the 3 forecast lines
  const [showXgb, setShowXgb] = useState(true);
  const [showLstm, setShowLstm] = useState(true);
  const [showTimesfm, setShowTimesfm] = useState(true);

  const handleGenerate = useCallback(async (targetTicker?: string) => {
    const symbol = (targetTicker || selectedTicker).trim().toUpperCase();
    if (!symbol) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiService.generatePrediction({
        ticker: symbol,
        period,
        horizon: 5,
        skip_timesfm: skipTimesfm,
      });
      setPrediction(res);
      if (symbol !== selectedTicker) {
        setSelectedTicker(symbol);
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [selectedTicker, period, skipTimesfm, setSelectedTicker]);

  useEffect(() => {
    handleGenerate(selectedTicker);
  }, [selectedTicker, handleGenerate]);

  // Derived metrics for selected stock
  const predictionStats = React.useMemo(() => {
    if (!prediction?.forecast_table || prediction.forecast_table.length === 0) return null;
    const day5 = prediction.forecast_table[prediction.forecast_table.length - 1];
    const targets = [day5.xgboost, day5.lstm, day5.timesfm].filter(
      (v): v is number => typeof v === "number" && !isNaN(v)
    );
    if (!targets.length) return null;

    const baseClose = prediction.last_observed_close;
    const avgDay5 = targets.reduce((a, b) => a + b, 0) / targets.length;
    const totalReturn = ((avgDay5 - baseClose) / baseClose) * 100;

    return {
      avgDay5,
      totalReturn,
      isPositive: totalReturn >= 0,
      xgbPct: day5.xgboost ? ((day5.xgboost - baseClose) / baseClose) * 100 : null,
      lstmPct: day5.lstm ? ((day5.lstm - baseClose) / baseClose) * 100 : null,
      tfmPct: day5.timesfm ? ((day5.timesfm - baseClose) / baseClose) * 100 : null,
    };
  }, [prediction]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 card-shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Multi-Model AI Forecasting</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              5-Trading-Day Stock Prediction
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Select or search any stock to generate real-time 5-day projections across XGBoost, LSTM neural networks, and Google TimesFM 2.5.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 text-white font-semibold">
              Selected: {selectedTicker}
            </span>
          </div>
        </div>

        {/* Prediction Controls & Quick Stock Selection */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Stock Search & Pills */}
          <div className="lg:col-span-6">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Stock Ticker
            </label>
            <StockSearch
              onSearch={(sym) => {
                setSelectedTicker(sym);
                handleGenerate(sym);
              }}
              isLoading={loading}
              showPills={true}
            />
          </div>

          {/* Historical Period Selector */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Historical Training Context
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs disabled:bg-slate-50"
            >
              <option value="1y">1 Year History (~250 days)</option>
              <option value="2y">2 Years History (~500 days)</option>
              <option value="5y">5 Years History (Recommended)</option>
              <option value="10y">10 Years History</option>
            </select>
          </div>

          {/* Fast Mode Toggle & Run Button */}
          <div className="lg:col-span-3 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-2">
              <input
                id="skip-tfm"
                type="checkbox"
                checked={skipTimesfm}
                onChange={(e) => setSkipTimesfm(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <label htmlFor="skip-tfm" className="text-xs text-slate-600 font-medium cursor-pointer">
                Fast Mode (Skip TimesFM)
              </label>
            </div>
            <button
              onClick={() => handleGenerate()}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing {selectedTicker}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Re-run Prediction</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => handleGenerate()} />}

      {/* Main Results View */}
      {loading ? (
        <div className="space-y-6">
          <ChartSkeleton height="h-96" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CardSkeleton rows={3} />
            <CardSkeleton rows={3} />
            <CardSkeleton rows={3} />
          </div>
        </div>
      ) : prediction ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Status & Last Observed Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight font-mono text-blue-400">
                  {prediction.ticker}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  5-Day Trading Horizon
                </span>
                {predictionStats && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                      predictionStats.isPositive
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                        : "bg-rose-950/80 text-rose-400 border border-rose-800"
                    }`}
                  >
                    {predictionStats.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{predictionStats.totalReturn >= 0 ? "+" : ""}{predictionStats.totalReturn.toFixed(2)}% Consensus</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Base Observed Close: <strong className="text-white font-mono">₹{prediction.last_observed_close.toFixed(2)}</strong> ({prediction.historical_timestamp})
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Elapsed: {prediction.execution_time_seconds}s</span>
              </div>
              <span>•</span>
              <span>{prediction.data_source}</span>
            </div>
          </div>

          {/* Interactive Line Chart Comparing Models */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 card-shadow space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  5-Day Multi-Model Forecast Curves ({prediction.ticker})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct price trajectory estimates across future trading sessions.
                </p>
              </div>

              {/* Model Visibility Toggle Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowXgb(!showXgb)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                    showXgb
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-slate-50 text-slate-400 border-slate-200 line-through"
                  }`}
                >
                  {showXgb ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>XGBoost</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLstm(!showLstm)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                    showLstm
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-50 text-slate-400 border-slate-200 line-through"
                  }`}
                >
                  {showLstm ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>LSTM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTimesfm(!showTimesfm)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                    showTimesfm
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-50 text-slate-400 border-slate-200 line-through"
                  }`}
                >
                  {showTimesfm ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>TimesFM</span>
                </button>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={prediction.forecast_table.map((row) => ({
                    date: row.forecast_date_estimate,
                    day: `Day +${row.horizon_trading_day}`,
                    xgboost: row.xgboost,
                    lstm: row.lstm,
                    timesfm: row.timesfm,
                  }))}
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11, fill: "#64748b", fontFamily: "monospace" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {showXgb && (
                    <Line
                      type="monotone"
                      dataKey="xgboost"
                      name="XGBoost"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#4f46e5" }}
                    />
                  )}
                  {showLstm && (
                    <Line
                      type="monotone"
                      dataKey="lstm"
                      name="LSTM"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#f59e0b" }}
                    />
                  )}
                  {showTimesfm && (
                    <Line
                      type="monotone"
                      dataKey="timesfm"
                      name="TimesFM"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#10b981" }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Target Cards for Selected Stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* XGBoost */}
            <div className="bg-white rounded-2xl border border-indigo-100 p-6 card-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold font-mono">
                  XGBoost
                </span>
                <span className="text-xs text-slate-500 font-mono">Day +5 Target</span>
              </div>
              <div className="font-mono text-2xl font-extrabold text-indigo-700">
                {prediction.forecasts.XGBoost?.[4] ? `₹${prediction.forecasts.XGBoost[4].toFixed(2)}` : "—"}
              </div>
              {predictionStats && predictionStats.xgbPct !== null && (
                <div className={`text-xs font-semibold flex items-center gap-1 ${predictionStats.xgbPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {predictionStats.xgbPct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{predictionStats.xgbPct >= 0 ? "+" : ""}{predictionStats.xgbPct.toFixed(2)}% vs Base Close</span>
                </div>
              )}
            </div>

            {/* LSTM */}
            <div className="bg-white rounded-2xl border border-amber-100 p-6 card-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold font-mono">
                  LSTM Neural Net
                </span>
                <span className="text-xs text-slate-500 font-mono">Day +5 Target</span>
              </div>
              <div className="font-mono text-2xl font-extrabold text-amber-700">
                {prediction.forecasts.LSTM?.[4] ? `₹${prediction.forecasts.LSTM[4].toFixed(2)}` : "—"}
              </div>
              {predictionStats && predictionStats.lstmPct !== null && (
                <div className={`text-xs font-semibold flex items-center gap-1 ${predictionStats.lstmPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {predictionStats.lstmPct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{predictionStats.lstmPct >= 0 ? "+" : ""}{predictionStats.lstmPct.toFixed(2)}% vs Base Close</span>
                </div>
              )}
            </div>

            {/* TimesFM */}
            <div className="bg-white rounded-2xl border border-emerald-100 p-6 card-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold font-mono">
                  TimesFM 2.5
                </span>
                <span className="text-xs text-slate-500 font-mono">Day +5 Target</span>
              </div>
              <div className="font-mono text-2xl font-extrabold text-emerald-700">
                {prediction.forecasts.TimesFM?.[4] ? `₹${prediction.forecasts.TimesFM[4].toFixed(2)}` : "—"}
              </div>
              {predictionStats && predictionStats.tfmPct !== null && (
                <div className={`text-xs font-semibold flex items-center gap-1 ${predictionStats.tfmPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {predictionStats.tfmPct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{predictionStats.tfmPct >= 0 ? "+" : ""}{predictionStats.tfmPct.toFixed(2)}% vs Base Close</span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Forecast Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 card-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Day-by-Day Forecast Values ({prediction.ticker})
              </h3>
              <span className="text-xs text-slate-400 font-mono">5 Business Days</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Horizon</th>
                    <th className="py-3 px-4">Est. Date</th>
                    <th className="py-3 px-4 text-right">XGBoost</th>
                    <th className="py-3 px-4 text-right">LSTM</th>
                    <th className="py-3 px-4 text-right">TimesFM</th>
                    <th className="py-3 px-4 text-right">Consensus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-sm">
                  {prediction.forecast_table.map((row) => {
                    const vals = [row.xgboost, row.lstm, row.timesfm].filter(
                      (v): v is number => typeof v === "number" && !isNaN(v)
                    );
                    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                    return (
                      <tr key={row.horizon_trading_day} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-700 font-sans font-semibold">
                          Day +{row.horizon_trading_day}
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-medium">
                          {row.forecast_date_estimate}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-indigo-700">
                          {row.xgboost ? `₹${row.xgboost.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-amber-700">
                          {row.lstm ? `₹${row.lstm.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {row.timesfm ? `₹${row.timesfm.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                          ₹{avg.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
