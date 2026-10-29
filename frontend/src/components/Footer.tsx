import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, LayoutDashboard, BrainCircuit, BarChart3, History } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 mt-auto text-slate-600 text-xs py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="font-bold text-sm text-slate-900 tracking-tight">
              Stock<span className="text-blue-600">Streak</span>
            </span>
            <span className="text-slate-400 text-xs ml-2 hidden sm:inline">
              | AI Multi-Model Stock Forecasting
            </span>
          </div>

          {/* Quick Page Links */}
          <nav className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <Link to="/dashboard" className="hover:text-blue-600 transition flex items-center gap-1">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <Link to="/predict" className="hover:text-blue-600 transition flex items-center gap-1">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Predict</span>
            </Link>
            <Link to="/history" className="hover:text-blue-600 transition flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              <span>Historical</span>
            </Link>
            <Link to="/models" className="hover:text-blue-600 transition flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Performance</span>
            </Link>
          </nav>

          {/* Copyright & Info */}
          <div className="text-slate-400 text-[11px] text-center md:text-right">
            © {new Date().getFullYear()} StockStreak. 5-Day Multi-Model Prediction Platform.
          </div>
        </div>
      </div>
    </footer>
  );
};
