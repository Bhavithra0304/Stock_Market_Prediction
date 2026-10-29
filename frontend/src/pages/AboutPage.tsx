import React from "react";
import { Link } from "react-router-dom";
import {
  BrainCircuit,
  Sparkles,
  ArrowRight,
  Database,
  ShieldAlert,
  GitBranch,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { ModelBadge } from "../components/ModelBadge";

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-12 py-4 animate-in fade-in duration-200">
      {/* Hero / Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 card-shadow">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Capstone Engineering Project & Research</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            About the StockStreak Platform
          </h1>

          <p className="text-base text-slate-600 leading-relaxed font-normal">
            StockStreak is a full-stack, AI-driven stock price prediction architecture designed to explore, evaluate, and compare classical machine learning algorithms, deep recurrent neural networks, and modern zero-shot time-series foundation models on Indian stock exchanges.
          </p>
        </div>
      </div>

      {/* Visual System Architecture Diagram */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 card-shadow space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            End-to-End System Architecture
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data ingestion, feature engineering, model inference, and reactive frontend visualization pipeline.
          </p>
        </div>

        {/* Diagram Flow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative pt-2">
          {/* Node 1 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Stage 1
              </span>
              <h3 className="text-xs font-bold text-slate-900 mt-0.5">Historical Ingestion</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Yahoo Finance API pulls daily adjusted OHLCV price histories.
              </p>
            </div>
          </div>

          {/* Node 2 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Stage 2
              </span>
              <h3 className="text-xs font-bold text-slate-900 mt-0.5">Preprocessing & Features</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                RSI-14, MACD, SMAs (5, 10, 20, 50), volatility & MinMaxScaler normalization.
              </p>
            </div>
          </div>

          {/* Node 3 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center font-bold">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Stage 3
              </span>
              <h3 className="text-xs font-bold text-slate-900 mt-0.5">Three ML Forecasters</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                XGBoost Regressor, LSTM 2-stage network, and TimesFM 2.5 zero-shot.
              </p>
            </div>
          </div>

          {/* Node 4 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center font-bold">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Stage 4
              </span>
              <h3 className="text-xs font-bold text-slate-900 mt-0.5">Forecast Comparison</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                MAE & RMSE calculation over identical 49 chronological origins.
              </p>
            </div>
          </div>

          {/* Node 5 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Stage 5
              </span>
              <h3 className="text-xs font-bold text-slate-900 mt-0.5">React Dashboard</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Interactive Recharts curves, toggle filters, and SQLite run logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement & Challenge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 card-shadow space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Project Objectives & Scope</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            The core objective of StockStreak is to provide a rigorous, transparent benchmarking environment for time-series stock prediction. Rather than presenting a single opaque model claiming unrealistic returns, StockStreak measures three distinct paradigms side-by-side:
          </p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Feature-Engineered Ensembles:</strong> Evaluating whether multi-output decision trees can capture non-linear patterns.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Deep Sequential Memory:</strong> Testing if gated LSTM recurrent units capture momentum and cyclical oscillations.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Foundation Models:</strong> Measuring zero-shot generalization of Google's 200M parameter TimesFM architecture.
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 card-shadow space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Why Stock Forecasting is Challenging</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Financial time series are notoriously difficult for standard machine learning models due to several inherent mathematical challenges:
          </p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Low Signal-to-Noise Ratio:</strong> Day-to-day market price fluctuations are dominated by noise, order-flow microstructures, and emotional sentiment.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Non-Stationarity & Regime Shifts:</strong> Probability distributions of returns evolve across macroeconomic cycles, interest rate shifts, and black-swan events.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Risk of Future Leakage:</strong> Normalizing data using full-dataset statistics or randomly shuffling time series leaks future information, yielding falsely high backtest performance.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Deep Dive into the 3 Models */}
      <section className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Methodological Deep Dive
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Model 1 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 card-shadow space-y-3">
            <ModelBadge model="XGBoost" />
            <h3 className="text-base font-bold text-slate-900">XGBoost Regressor</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Supervised gradient boosted decision trees fitted using <code>MultiOutputRegressor</code>. Instead of autoregressively feeding predictions into future steps, it directly maps 22 features computed at date <em>t</em> to the 5 target closes: <code>t+1, ..., t+5</code>.
            </p>
            <div className="pt-2 text-[11px] text-slate-500 font-mono space-y-1">
              <div>Trees: 450 • Max Depth: 4</div>
              <div>Learning Rate: 0.03 • Subsample: 0.85</div>
            </div>
          </div>

          {/* Model 2 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 card-shadow space-y-3">
            <ModelBadge model="LSTM" />
            <h3 className="text-base font-bold text-slate-900">LSTM Recurrent Network</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sequential neural network architecture comprising an Input layer (60 time steps), a 64-unit LSTM layer with return sequences, a 15% dropout regularization layer, a 32-unit LSTM layer, a 32-unit Dense ReLU layer, and a 5-unit Linear output head.
            </p>
            <div className="pt-2 text-[11px] text-slate-500 font-mono space-y-1">
              <div>Lookback: 60 Trading Days</div>
              <div>Optimizer: Adam (lr=0.001) • MSE Loss</div>
            </div>
          </div>

          {/* Model 3 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 card-shadow space-y-3">
            <ModelBadge model="TimesFM" />
            <h3 className="text-base font-bold text-slate-900">TimesFM 2.5 (Google)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Google Research's 200M parameter decoder-only transformer time-series foundation model. Employs patched self-attention and input normalization to forecast 5 horizon steps without fine-tuning on individual stock weights.
            </p>
            <div className="pt-2 text-[11px] text-slate-500 font-mono space-y-1">
              <div>Parameters: 200 Million</div>
              <div>Zero-Shot Inference • Torch Backend</div>
            </div>
          </div>
        </div>
      </section>

      {/* Limitations and Future Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 card-shadow space-y-4">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-base font-bold text-slate-900">Current System Limitations</h2>
          </div>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>
                <strong>Exchange Calendar Approximations:</strong> Forecast dates use standard business-day offsets (Mon-Fri) without querying exchange-specific holiday schedules.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>
                <strong>Univariate Temporal Input for LSTM:</strong> The LSTM architecture currently trains on closing prices and does not ingest fundamental earnings reports or order-book depth.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>
                <strong>External Shocks:</strong> Unanticipated regulatory actions, policy interest rate shifts, and corporate disclosures cannot be anticipated solely from numerical history.
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 card-shadow space-y-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Lightbulb className="w-5 h-5" />
            <h2 className="text-base font-bold text-slate-900">Future Enhancements</h2>
          </div>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>
                <strong>Financial News NLP Sentiment:</strong> Integrating FinBERT sentiment signals from financial news wires into the XGBoost feature space.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>
                <strong>Quantile Confidence Intervals:</strong> Visualizing upper and lower prediction bounds using TimesFM's continuous quantile heads.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>
                <strong>NSE/BSE Holiday Calendar Integration:</strong> Direct integration with the National Stock Exchange of India holiday API to purge non-trading days.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Academic Capstone Notice */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 card-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
            <ShieldAlert className="w-4 h-4" />
            <span>Academic Capstone Project</span>
          </div>
          <h3 className="text-xl font-bold">Experimental Machine Learning Research</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            StockStreak is strictly designed for educational demonstration and quantitative model benchmarking. None of the statistical estimates produced by the platform constitute financial recommendations.
          </p>
        </div>

        <Link
          to="/predict"
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shrink-0 flex items-center gap-2"
        >
          <span>Try Prediction Pipeline</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
