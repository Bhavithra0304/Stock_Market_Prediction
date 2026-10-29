import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = "Request Failed",
  message,
  onRetry,
}) => {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-rose-900 shadow-sm animate-in fade-in duration-200">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-rose-950 text-sm">{title}</h4>
          <p className="mt-1 text-sm text-rose-800 leading-relaxed">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Request</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
