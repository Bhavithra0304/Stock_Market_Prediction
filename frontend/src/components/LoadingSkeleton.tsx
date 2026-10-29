import React from "react";

export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 card-shadow animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-slate-200 rounded-md w-1/3"></div>
        <div className="h-8 bg-slate-100 rounded-lg w-16"></div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-slate-100 rounded"
            style={{ width: `${85 - i * 12}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = "h-80" }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-6 card-shadow animate-pulse flex flex-col justify-between ${height}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 bg-slate-200 rounded w-48"></div>
          <div className="h-3 bg-slate-100 rounded w-32"></div>
        </div>
        <div className="h-8 bg-slate-100 rounded-lg w-28"></div>
      </div>
      <div className="flex items-end justify-between gap-3 h-48 pt-6">
        {[40, 65, 50, 80, 55, 90, 75, 60, 85, 95].map((val, idx) => (
          <div
            key={idx}
            className="bg-slate-100 rounded-t w-full"
            style={{ height: `${val}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
};
