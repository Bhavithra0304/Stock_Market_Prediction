import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  TrendingUp,
  LayoutDashboard,
  BrainCircuit,
  BarChart3,
  History,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { apiService } from "../services/api";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Predict", path: "/predict", icon: BrainCircuit },
  { name: "Historical Data", path: "/history", icon: History },
  { name: "Model Performance", path: "/models", icon: BarChart3 },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkApi = async () => {
      try {
        const health = await apiService.getHealth();
        if (mounted) setBackendOnline(health.status === "ok");
      } catch {
        if (mounted) setBackendOnline(false);
      }
    };

    checkApi();
    const interval = setInterval(checkApi, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5 text-blue-300" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-slate-900 tracking-tight">
                    Stock<span className="text-blue-600">Streak</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/70 rounded">
                    AI
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium -mt-0.5">
                  Multi-Model Market Intelligence
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-slate-100 text-blue-700 font-bold shadow-2xs"
                        : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Predict Action Button */}
            <Link
              to="/predict"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Predict Stock</span>
            </Link>

            {/* Health Indicator */}
            <div
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                backendOnline === true
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                  : backendOnline === false
                  ? "bg-rose-50 text-rose-700 border-rose-200/80"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
              title={backendOnline ? "Connected to FastAPI at 127.0.0.1:8000" : "Backend offline"}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline === true
                    ? "bg-emerald-500 animate-pulse"
                    : backendOnline === false
                    ? "bg-rose-500"
                    : "bg-slate-400"
                }`}
              />
              <span className="font-mono text-[11px]">
                {backendOnline === true
                  ? "API Online"
                  : backendOnline === false
                  ? "API Offline"
                  : "Connecting..."}
              </span>
            </div>

            {/* FastAPI Docs link */}
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition"
              title="Open FastAPI Swagger Documentation"
            >
              <span>API Docs</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="py-2 mb-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Navigation
            </span>
            <span className="text-xs text-slate-400 font-mono">StockStreak v1.0</span>
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="pt-2">
            <Link
              to="/predict"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Predict Stock</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
