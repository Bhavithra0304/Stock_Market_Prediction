import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
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
  Calendar,
  Clock,
  ArrowUpDown,
  Download,
  BrainCircuit,
  ArrowRight,
} from "lucide-react";
import { apiService, formatApiError } from "../services/api";
import type { HistoricalDataResponse } from "../types";
import { StatCard } from "../components/StatCard";
import { ErrorAlert } from "../components/ErrorAlert";
import { ChartSkeleton, CardSkeleton } from "../components/LoadingSkeleton";
import { CustomTooltip } from "../components/ChartTooltip";
import { useStock } from "../context/StockContext";

const PERIOD_OPTIONS = [
  { label: "1 Month", value: "1mo" },
  { label: "3 Months", value: "3mo" },
  { label: "6 Months", value: "6mo" },
  { label: "1 Year", value: "1y" },
  { label: "2 Years", value: "2y" },
  { label: "5 Years", value: "5y" },
];

export const HistoricalDataPage: React.FC = () => {
  const { selectedTicker } = useStock();
  const [period, setPeriod] = useState("1y");
  const [histData, setHistData] = useState<HistoricalDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchHistory = useCallback(async (sym: string, per: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getHistoricalData(sym, per, "1d");
      setHistData(res);
      setCurrentPage(1);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(selectedTicker, period);
  }, [selectedTicker, period, fetchHistory]);

  const reversedData = React.useMemo(() => {
    if (!histData?.data) return [];
    return [...histData.data].reverse();
  }, [histData]);

  const paginatedRows = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return reversedData.slice(start, start + pageSize);
  }, [reversedData, currentPage]);

  const totalPages = Math.ceil(reversedData.length / pageSize);

  const downloadCsv = () => {
    if (!histData?.data.length) return;
    const headers = "Date,Open,High,Low,Close,Volume\n";
    const rows = histData.data
      .map(
        (r) =>
          `${r.date},${r.open.toFixed(2)},${r.high.toFixed(2)},${r.low.toFixed(2)},${r.close.toFixed(2)},${r.volume}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedTicker}_historical_${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header and Lookback Controls */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 card-shadow space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
                {selectedTicker}
              </span>
              <span className="text-xs text-slate-400 font-medium">Daily OHLCV Data</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Historical Market Explorer
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Inspect historical daily trading sessions, volume patterns, and adjusted closing prices for <strong>{selectedTicker}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Link
              to="/predict"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Predict Another Stock</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            <button
              onClick={downloadCsv}
              disabled={!histData?.data.length || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Lookback Period Selector Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Timeframe Horizon:
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                  period === opt.value
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => fetchHistory(selectedTicker, period)} />}

      {/* Summary Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
        </div>
      ) : histData?.summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Latest Close"
            value={`₹${histData.summary.latest_close.toFixed(2)}`}
            change={histData.summary.change_percent}
            changeText={`₹${histData.summary.change >= 0 ? "+" : ""}${histData.summary.change.toFixed(2)}`}
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
            variant="blue"
          />
          <StatCard
            title="Trading Volume"
            value={histData.summary.volume.toLocaleString()}
            subtitle={`Updated: ${histData.summary.last_date}`}
            icon={<Clock className="w-5 h-5 text-indigo-600" />}
            variant="indigo"
          />
          <StatCard
            title="52-Week High"
            value={`₹${histData.summary.high_52w.toFixed(2)}`}
            subtitle="Observed Peak"
            icon={<Calendar className="w-5 h-5 text-emerald-600" />}
            variant="emerald"
          />
          <StatCard
            title="52-Week Low"
            value={`₹${histData.summary.low_52w.toFixed(2)}`}
            subtitle="Observed Trough"
            icon={<Calendar className="w-5 h-5 text-amber-600" />}
            variant="amber"
          />
        </div>
      ) : null}

      {/* Chart: Historical Price Series */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 card-shadow space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {selectedTicker} — Price History ({period.toUpperCase()})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily adjusted closing series provided by {histData?.data_source || "Yahoo Finance"}
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Total Sessions: {histData?.data?.length || 0}
          </div>
        </div>

        {loading ? (
          <ChartSkeleton height="h-80" />
        ) : histData?.data ? (
          <div className="h-80 sm:h-96 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={histData.data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  minTickGap={30}
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
                  dataKey="close"
                  name="Close Price"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>

      {/* Historical Data Table with Pagination */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 card-shadow space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Daily Historical OHLCV Records ({selectedTicker})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Page {currentPage} of {totalPages || 1}
          </span>
        </div>

        {loading ? (
          <CardSkeleton rows={6} />
        ) : paginatedRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Open</th>
                  <th className="py-2.5 px-3 text-right">High</th>
                  <th className="py-2.5 px-3 text-right">Low</th>
                  <th className="py-2.5 px-3 text-right">Close</th>
                  <th className="py-2.5 px-3 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {paginatedRows.map((row) => (
                  <tr key={row.date} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-slate-900 font-sans font-medium">
                      {row.date}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">₹{row.open.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">₹{row.high.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">₹{row.low.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ₹{row.close.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {row.volume.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            No historical records loaded for {selectedTicker}.
          </div>
        )}

        {/* Pagination buttons */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition cursor-pointer"
            >
              Previous
            </button>
            <span className="text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, reversedData.length)} of {reversedData.length} records
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
