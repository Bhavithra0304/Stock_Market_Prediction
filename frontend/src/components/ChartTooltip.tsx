import React from "react";

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  prefix?: string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  prefix = "₹",
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl border border-slate-800 shadow-xl text-xs z-50 pointer-events-none min-w-[150px]">
      <div className="font-medium text-slate-400 border-b border-slate-800 pb-1 mb-2 font-mono">
        {label}
      </div>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-300 capitalize">{entry.name}:</span>
            </div>
            <span className="font-bold text-white font-mono">
              {prefix}
              {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
