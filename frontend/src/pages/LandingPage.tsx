import React from "react";
import { Link } from "react-router-dom";
import {
  BrainCircuit,
  ArrowRight,
  Cpu,
  Network,
  Sparkles,
  LineChart,
  LayoutDashboard,
  Zap,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-12 py-4 animate-in fade-in duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 lg:p-16 card-shadow border border-slate-800">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Time-Series Forecasting Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
            Professional AI Stock Market{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 block mt-1">
              Prediction & Analytics
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl">
            Compare 5-trading-day point forecasts generated simultaneously across XGBoost Gradient Boosting, LSTM Deep Recurrent Networks, and Google TimesFM 2.5 Foundation Model.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              to="/predict"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition-all"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Go to Prediction Studio</span>
              <ArrowRight className="w-4 h-4 text-blue-200" />
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>Open Dashboard</span>
            </Link>
          </div>
        </div>

        {/* 3 Model Cards Row */}
        <div className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">XGBoost Regressor</div>
              <div className="text-[11px] text-slate-400">22 Financial Indicators • Multi-Target</div>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">LSTM Deep Recurrent</div>
              <div className="text-[11px] text-slate-400">60-Day Lookback • Temporal Sequences</div>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">TimesFM 2.5 (Google)</div>
              <div className="text-[11px] text-slate-400">200M Transformer • Zero-Shot Forecasting</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 card-shadow space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Dedicated Prediction Studio</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Select any stock ticker symbol, choose lookback context, and generate comprehensive 5-day projections across all models.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 card-shadow space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <LineChart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Multi-Model Ensemble</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Directly compare individual predictions against consensus trajectories to quantify forecast spread and uncertainty.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 card-shadow space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Auditable Run History</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every prediction is persistently logged into an embedded SQLite database for post-hoc validation and tracking.
          </p>
        </div>
      </section>
    </div>
  );
};
