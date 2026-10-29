import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PredictionPage } from "./pages/PredictionPage";
import { ModelPerformancePage } from "./pages/ModelPerformancePage";
import { HistoricalDataPage } from "./pages/HistoricalDataPage";
import { StockProvider } from "./context/StockContext";

export const App: React.FC = () => {
  return (
    <StockProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/predict" element={<PredictionPage />} />
            <Route path="/models" element={<ModelPerformancePage />} />
            <Route path="/history" element={<HistoricalDataPage />} />
            <Route path="/about" element={<Navigate to="/dashboard" replace />} />
            {/* Catch-all redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StockProvider>
  );
};

export default App;
