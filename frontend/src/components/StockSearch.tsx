import React, { useState, useEffect } from "react";
import { Search, Sparkles } from "lucide-react";
import { useStock, POPULAR_STOCKS } from "../context/StockContext";

interface StockSearchProps {
  onSearch: (ticker: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  showPills?: boolean;
}

export const StockSearch: React.FC<StockSearchProps> = ({
  onSearch,
  isLoading = false,
  placeholder = "Search ticker (e.g. RELIANCE.NS, TCS.NS, INFY.NS, AAPL)...",
  showPills = true,
}) => {
  const { selectedTicker, setSelectedTicker } = useStock();
  const [inputVal, setInputVal] = useState(selectedTicker);

  useEffect(() => {
    setInputVal(selectedTicker);
  }, [selectedTicker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputVal.trim().toUpperCase();
    if (clean) {
      setSelectedTicker(clean);
      onSearch(clean);
    }
  };

  const handlePillClick = (symbol: string) => {
    setInputVal(symbol);
    setSelectedTicker(symbol);
    onSearch(symbol);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value.toUpperCase())}
            placeholder={placeholder}
            disabled={isLoading}
            className="w-full pl-10 pr-28 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs transition disabled:bg-slate-50 disabled:cursor-not-allowed uppercase font-mono"
          />
          <button
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            className="absolute right-1.5 inset-y-1.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>{isLoading ? "Predicting..." : "Analyze & Predict"}</span>
          </button>
        </div>
      </form>

      {showPills && (
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 shrink-0 font-medium">Quick Select:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {POPULAR_STOCKS.map((item) => {
              const isSelected = selectedTicker === item.symbol;
              return (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => handlePillClick(item.symbol)}
                  disabled={isLoading}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-medium transition cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                  title={`${item.name} (${item.sector || ""})`}
                >
                  <span>{item.symbol}</span>
                  <span className={`ml-1 text-[10px] font-sans hidden sm:inline ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                    • {item.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
