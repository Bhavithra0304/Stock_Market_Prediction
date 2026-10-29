import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeText?: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  badge?: string;
  variant?: "default" | "blue" | "indigo" | "emerald" | "amber" | "rose";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeText,
  subtitle,
  icon,
  badge,
  variant = "default",
}) => {
  const isPositive = change !== undefined ? change > 0 : false;
  const isNegative = change !== undefined ? change < 0 : false;

  // Safe icon renderer that supports both JSX elements and component functions/forwardRef objects
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (
      typeof icon === "function" ||
      (typeof icon === "object" && icon !== null && "$$typeof" in icon)
    ) {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="w-5 h-5" />;
    }
    return null;
  };

  const variantStyles = {
    default: {
      card: "bg-white border-slate-200/80 hover:border-slate-300",
      iconBox: "bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600",
    },
    blue: {
      card: "bg-gradient-to-br from-white via-white to-blue-50/40 border-blue-200/80 hover:border-blue-300",
      iconBox: "bg-blue-100/70 text-blue-700 group-hover:bg-blue-600 group-hover:text-white",
    },
    indigo: {
      card: "bg-gradient-to-br from-white via-white to-indigo-50/40 border-indigo-200/80 hover:border-indigo-300",
      iconBox: "bg-indigo-100/70 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white",
    },
    emerald: {
      card: "bg-gradient-to-br from-white via-white to-emerald-50/40 border-emerald-200/80 hover:border-emerald-300",
      iconBox: "bg-emerald-100/70 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white",
    },
    amber: {
      card: "bg-gradient-to-br from-white via-white to-amber-50/40 border-amber-200/80 hover:border-amber-300",
      iconBox: "bg-amber-100/70 text-amber-700 group-hover:bg-amber-600 group-hover:text-white",
    },
    rose: {
      card: "bg-gradient-to-br from-white via-white to-rose-50/40 border-rose-200/80 hover:border-rose-300",
      iconBox: "bg-rose-100/70 text-rose-700 group-hover:bg-rose-600 group-hover:text-white",
    },
  }[variant];

  return (
    <div
      className={`rounded-2xl border p-5 card-shadow card-shadow-hover relative overflow-hidden group transition-all ${variantStyles.card}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
          {title}
        </span>
        {icon && (
          <div
            className={`p-2.5 rounded-xl border border-transparent transition-all duration-200 ${variantStyles.iconBox}`}
          >
            {renderIcon()}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
          {value}
        </span>
        {badge && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {badge}
          </span>
        )}
      </div>

      {(change !== undefined || subtitle) && (
        <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-slate-100/80">
          {change !== undefined && (
            <div
              className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-xs ${
                isPositive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                  : isNegative
                  ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              ) : isNegative ? (
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {change.toFixed(2)}%
              </span>
              {changeText && (
                <span className="font-normal text-[11px] opacity-80 ml-0.5">
                  ({changeText})
                </span>
              )}
            </div>
          )}
          {subtitle && (
            <span className="text-slate-500 text-[11px] font-medium ml-auto truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
