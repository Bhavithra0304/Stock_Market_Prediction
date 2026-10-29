import React from "react";
import { Cpu, Network, Sparkles } from "lucide-react";

interface ModelBadgeProps {
  model: "XGBoost" | "LSTM" | "TimesFM" | string;
  size?: "sm" | "md";
}

export const ModelBadge: React.FC<ModelBadgeProps> = ({ model, size = "md" }) => {
  const norm = model.toLowerCase();
  
  if (norm.includes("xgb")) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}>
        <Cpu className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        <span>XGBoost</span>
      </span>
    );
  }

  if (norm.includes("lstm")) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}>
        <Network className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        <span>LSTM</span>
      </span>
    );
  }

  if (norm.includes("times") || norm.includes("tfm")) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}>
        <Sparkles className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        <span>TimesFM 2.5</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
      {model}
    </span>
  );
};
