import React, { createContext, useContext, useState } from "react";

export interface StockInfo {
  symbol: string;
  name: string;
  sector?: string;
}

export const POPULAR_STOCKS: StockInfo[] = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy & Conglomerate" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", sector: "Information Technology" },
  { symbol: "INFY.NS", name: "Infosys Ltd", sector: "Information Technology" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd", sector: "Banking & Financials" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", sector: "Automobile" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", sector: "Banking" },
  { symbol: "AAPL", name: "Apple Inc.", sector: "Consumer Tech" },
  { symbol: "NVDA", name: "Nvidia Corp.", sector: "Semiconductors" },
];

interface StockContextType {
  selectedTicker: string;
  setSelectedTicker: (ticker: string) => void;
  popularStocks: StockInfo[];
}

const StockContext = createContext<StockContextType | undefined>(undefined);

const STORAGE_KEY = "stockstreak_selected_ticker";

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedTicker, setTickerState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || "RELIANCE.NS";
  });

  const setSelectedTicker = (ticker: string) => {
    const cleaned = ticker.trim().toUpperCase();
    if (!cleaned) return;
    setTickerState(cleaned);
    try {
      localStorage.setItem(STORAGE_KEY, cleaned);
    } catch {
      // Ignore localStorage errors in sandbox
    }
  };

  return (
    <StockContext.Provider
      value={{
        selectedTicker,
        setSelectedTicker,
        popularStocks: POPULAR_STOCKS,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = (): StockContextType => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error("useStock must be used within a StockProvider");
  }
  return context;
};
