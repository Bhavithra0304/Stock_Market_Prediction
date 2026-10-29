import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  TrendingUp,
  BrainCircuit,
  BarChart3,
  Calendar,
  History,
  ArrowRight,
  TrendingDown,
  Percent,
  Zap,
  Activity,
} from "lucide-react";
import { apiService, formatApiError } from "../services/api";
import type {
  HistoricalDataResponse,
  PredictionResponse,
  PredictionRecord,
} from "../types";
import { StatCard } from "../components/StatCard";
import { CardSkeleton, ChartSkeleton } from "../components/LoadingSkeleton";
import { ErrorAlert } from "../components/ErrorAlert";
import { ModelBadge } from "../components/ModelBadge";
import { CustomTooltip } from "../components/ChartTooltip";
import { useStock } from "../context/StockContext";

export const DashboardPage: React.FC = () => {
  const { selectedTicker, setSelectedTicker } = useStock();
  const navigate = useNavigate();

  const [histData, setHistData] = useState<HistoricalDataResponse | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardOverview = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch recent prediction runs from SQLite
        const recs = await apiService.getPredictionHistory().catch(() => []);
        if (!isMounted) return;
        setRecords(recs);

        // Determine which stock to display on the dashboard (most recently predicted or selected)
        const targetSymbol = recs.length > 0 ? recs[0].ticker : selectedTicker || "RELIANCE.NS";

        // Fetch historical data and prediction in parallel
        const [histRes, predRes] = await Promise.all([
          apiService.getHistoricalData(targetSymbol, "6mo", "1d"),
          apiService.generatePrediction({
            ticker: targetSymbol,
            period: "5y",
            horizon: 5,
            skip_timesfm: false,
          }).catch(() => null),
        ]);

        if (!isMounted) return;
        setHistData(histRes);
        setPrediction(predRes);
        if (targetSymbol !== selectedTicker) {
          setSelectedTicker(targetSymbol);
        }
      } catch (err) {
        if (isMounted) setError(formatApiError(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenPredictForTicker = (ticker: string) => {
    setSelectedTicker(ticker);
    navigate("/predict");
  };

  // Merge historical recent points with forecast points for visualization
  const combinedChartData = React.useMemo(() => {
    if (!histData?.data) return [];
    // Last 30 trading days of history
    const slice = histData.data.slice(-30).map((d) => ({
      date: d.date,
      historicalClose: d.close,
      xgboost: null as number | null,
      lstm: null as number | null,
      timesfm: null as number | null,
    }));

    if (prediction?.forecast_table && prediction.forecast_table.length > 0) {
      const lastPoint = slice[slice.length - 1];
      if (lastPoint) {
        lastPoint.xgboost = lastPoint.historicalClose;
        lastPoint.lstm = lastPoint.historicalClose;
        lastPoint.timesfm = lastPoint.historicalClose;
      }

      prediction.forecast_table.forEach((item) => {
        slice.push({
          date: item.forecast_date_estimate,
          historicalClose: null as any,
          xgboost: item.xgboost,
          lstm: item.lstm,
          timesfm: item.timesfm,
        });
      });
    }

    return slice;
  }, [histData, prediction]);

  // Derived prediction consensus metrics for the dashboard stock
  const forecastStats = React.useMemo(() => {
    if (!prediction?.forecast_table || prediction.forecast_table.length === 0 || !histData?.summary) {
      return null;
    }
    const currentPrice = histData.summary.latest_close;
    const day5Row = prediction.forecast_table[prediction.forecast_table.length - 1];
    const validDay5Targets = [day5Row.xgboost, day5Row.lstm, day5Row.timesfm].filter(
      (v): v is number => typeof v === "number" && !isNaN(v)
    );

    if (validDay5Targets.length === 0) return null;

    const avgDay5 = validDay5Targets.reduce((a, b) => a + b, 0) / validDay5Targets.length;
    const diff = avgDay5 - currentPrice;
    const pct = (diff / currentPrice) * 100;

    return {
      consensusDay5: avgDay5,
      expectedChange: diff,
      expectedPct: pct,
      isBullish: diff >= 0,
      xgbDay5: day5Row.xgboost,
      lstmDay5: day5Row.lstm,
      timesfmDay5: day5Row.timesfm,
    };
  }, [prediction, histData]);

  const displayStock = prediction?.ticker || histData?.ticker || selectedTicker;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Dashboard Top Banner (Pure Dashboard Content) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-mono font-bold tracking-wider">
                {displayStock}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Intelligence</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Market Intelligence & Forecast Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Overview of latest market movements, 5-day ensemble price projections, and recent prediction runs.
            </p>
          </div>

          {/* Action CTA: Go to Prediction Page to Select and Predict Any Stock */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to="/predict"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition cursor-pointer"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Predict Another Stock</span>
              <ArrowRight className="w-4 h-4 text-blue-200" />
            </Link>
          </div>
        </div>

        {/* Dashboard Quick Metric Badges */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Predictions</span>
              <span className="text-sm font-bold text-white font-mono">{records.length} Recorded</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Forecasters</span>
              <span className="text-sm font-bold text-white font-mono">3 AI Models</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Horizon Length</span>
              <span className="text-sm font-bold text-white font-mono">5 Trading Days</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Database Storage</span>
              <span className="text-sm font-bold text-white font-mono">SQLite Persistent</span>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => window.location.reload()} />}

      {/* Financial & Forecast Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
        </div>
      ) : histData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={`${displayStock} Observed Close`}
            value={`₹${histData.summary.latest_close.toFixed(2)}`}
            change={histData.summary.change_percent}
            changeText={`₹${histData.summary.change >= 0 ? "+" : ""}${histData.summary.change.toFixed(2)}`}
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
            variant="blue"
          />

          <StatCard
            title="52-Week Price Range"
            value={`₹${histData.summary.high_52w.toFixed(2)}`}
            subtitle={`52W Low: ₹${histData.summary.low_52w.toFixed(2)}`}
            icon={<Calendar className="w-5 h-5 text-indigo-600" />}
            variant="indigo"
          />

          <StatCard
            title="5-Day Forecast Target"
            value={
              forecastStats
                ? `₹${forecastStats.consensusDay5.toFixed(2)}`
                : "—"
            }
            change={forecastStats ? forecastStats.expectedPct : undefined}
            changeText={
              forecastStats
                ? `${forecastStats.isBullish ? "+" : ""}${forecastStats.expectedChange.toFixed(2)} (Day 5)`
                : "Latest forecast"
            }
            icon={<BrainCircuit className="w-5 h-5 text-emerald-600" />}
            variant={forecastStats?.isBullish ? "emerald" : "rose"}
          />

          <StatCard
            title="Consensus Outlook"
            value={
              forecastStats
                ? forecastStats.isBullish
                  ? "BULLISH"
                  : "BEARISH"
                : "READY"
            }
            subtitle={
              forecastStats
                ? `Projected ${forecastStats.expectedPct >= 0 ? "+" : ""}${forecastStats.expectedPct.toFixed(2)}% over 5 days`
                : "Ensemble average"
            }
            icon={<Percent className="w-5 h-5 text-amber-600" />}
            variant="amber"
          />
        </div>
      ) : null}

      {/* Main Combined Trend & Forecast Chart */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 card-shadow space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {displayStock} — Historical Closes & 5-Day Forecast Projections
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Observed historical price history connected with projected trajectory curves.
            </p>
          </div>

          {/* Model legend indicator pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
              <span>Historical Close</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>XGBoost</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>LSTM</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>TimesFM 2.5</span>
            </span>
          </div>
        </div>

        {loading ? (
          <ChartSkeleton height="h-80" />
        ) : (
          <div className="h-80 sm:h-96 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedChartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  minTickGap={25}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11, fill: "#64748b", fontFamily: "monospace" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="historicalClose"
                  name="Historical Close"
                  stroke="#0f172a"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="xgboost"
                  name="XGBoost"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3.5, fill: "#4f46e5" }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="lstm"
                  name="LSTM"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3.5, fill: "#f59e0b" }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="timesfm"
                  name="TimesFM"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  strokeDasharray="2 2"
                  dot={{ r: 3.5, fill: "#10b981" }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Two Column Grid: 5-Day Forecast Breakdown & Forecast Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast Table for the Dashboard Stock */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 card-shadow space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                5-Day Forecast Table ({displayStock})
              </h3>
            </div>
            <Link
              to="/predict"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
            >
              <span>Predict Any Stock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {prediction?.forecast_table ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Horizon</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">XGBoost</th>
                    <th className="py-2.5 px-3 text-right">LSTM</th>
                    <th className="py-2.5 px-3 text-right">TimesFM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {prediction.forecast_table.map((row) => (
                    <tr key={row.horizon_trading_day} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-700 font-sans font-semibold">
                        Day +{row.horizon_trading_day}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900 font-medium">
                        {row.forecast_date_estimate}
                      </td>
                      <td className="py-2.5 px-3 text-right text-indigo-700 font-bold">
                        {row.xgboost ? `₹${row.xgboost.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-700 font-bold">
                        {row.lstm ? `₹${row.lstm.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                        {row.timesfm ? `₹${row.timesfm.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No forecast generated yet. Go to Predict page to generate predictions.
            </div>
          )}
        </div>

        {/* Selected Stock Model Target Comparison Cards */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 card-shadow space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Model Day +5 Targets ({displayStock})
              </h3>
            </div>
            <Link
              to="/models"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
            >
              <span>Backtest Comparison</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {forecastStats && histData ? (
            <div className="space-y-3">
              {/* XGBoost Target */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/40">
                <div className="flex items-center gap-3">
                  <ModelBadge model="XGBoost" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Gradient Boosted Trees</span>
                    <span className="text-[11px] text-slate-500">Day +5 Target Price</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-indigo-700">
                    {forecastStats.xgbDay5 ? `₹${forecastStats.xgbDay5.toFixed(2)}` : "—"}
                  </div>
                  {forecastStats.xgbDay5 && (
                    <span className="text-[10px] text-slate-500 font-sans">
                      {((forecastStats.xgbDay5 - histData.summary.latest_close) / histData.summary.latest_close * 100).toFixed(2)}% vs Close
                    </span>
                  )}
                </div>
              </div>

              {/* LSTM Target */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-amber-100 bg-amber-50/40">
                <div className="flex items-center gap-3">
                  <ModelBadge model="LSTM" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Recurrent Neural Net</span>
                    <span className="text-[11px] text-slate-500">Day +5 Target Price</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-amber-700">
                    {forecastStats.lstmDay5 ? `₹${forecastStats.lstmDay5.toFixed(2)}` : "—"}
                  </div>
                  {forecastStats.lstmDay5 && (
                    <span className="text-[10px] text-slate-500 font-sans">
                      {((forecastStats.lstmDay5 - histData.summary.latest_close) / histData.summary.latest_close * 100).toFixed(2)}% vs Close
                    </span>
                  )}
                </div>
              </div>

              {/* TimesFM Target */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/40">
                <div className="flex items-center gap-3">
                  <ModelBadge model="TimesFM" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Google TimesFM 2.5</span>
                    <span className="text-[11px] text-slate-500">Day +5 Target Price</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-emerald-700">
                    {forecastStats.timesfmDay5 ? `₹${forecastStats.timesfmDay5.toFixed(2)}` : "—"}
                  </div>
                  {forecastStats.timesfmDay5 && (
                    <span className="text-[10px] text-slate-500 font-sans">
                      {((forecastStats.timesfmDay5 - histData.summary.latest_close) / histData.summary.latest_close * 100).toFixed(2)}% vs Close
                    </span>
                  )}
                </div>
              </div>

              {/* Consensus Summary bar */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                  forecastStats.isBullish
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                    : "bg-rose-50/80 border-rose-200 text-rose-950"
                }`}
              >
                <div className="flex items-center gap-2">
                  {forecastStats.isBullish ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                  )}
                  <span className="font-semibold">
                    Consensus 5-Day Outlook:{" "}
                    <strong className={forecastStats.isBullish ? "text-emerald-700" : "text-rose-700"}>
                      {forecastStats.isBullish ? "BULLISH" : "BEARISH"} (
                      {forecastStats.expectedPct >= 0 ? "+" : ""}
                      {forecastStats.expectedPct.toFixed(2)}%)
                    </strong>
                  </span>
                </div>
                <span className="font-mono font-bold text-[11px]">
                  Target: ₹{forecastStats.consensusDay5.toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs rounded-2xl bg-slate-50 border border-slate-200/60">
              Run a forecast from the Predict page to inspect target details.
            </div>
          )}
        </div>
      </div>

      {/* Recent Prediction Logs from SQLite */}
      {records.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 card-shadow space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Recent Prediction Audit Logs (SQLite Database)
              </h3>
            </div>
            <Link
              to="/predict"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              + Predict Another Stock
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Run ID</th>
                  <th className="py-2.5 px-3">Stock Ticker</th>
                  <th className="py-2.5 px-3">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3 text-right">Base Close</th>
                  <th className="py-2.5 px-3 text-right">XGBoost Day 5</th>
                  <th className="py-2.5 px-3 text-right">LSTM Day 5</th>
                  <th className="py-2.5 px-3 text-right">TimesFM Day 5</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {records.slice(0, 6).map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-slate-400">#{rec.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-sans">
                      {rec.ticker}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-sans">{rec.requested_at}</td>
                    <td className="py-2.5 px-3 text-right text-slate-800">
                      ₹{rec.last_close.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-indigo-700 font-semibold">
                      {rec.xgboost_forecast?.[4] ? `₹${rec.xgboost_forecast[4].toFixed(2)}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-700 font-semibold">
                      {rec.lstm_forecast?.[4] ? `₹${rec.lstm_forecast[4].toFixed(2)}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">
                      {rec.timesfm_forecast?.[4] ? `₹${rec.timesfm_forecast[4].toFixed(2)}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleOpenPredictForTicker(rec.ticker)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-sans text-[11px] font-bold transition cursor-pointer"
                      >
                        Open in Predict
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
