import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all ${
              isSuccess
                ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-300'
                : isError
                ? 'bg-slate-900/95 border-rose-500/40 text-rose-300'
                : 'bg-slate-900/95 border-cyan-500/40 text-cyan-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
              {isError && <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />}
              {!isSuccess && !isError && <Info className="h-5 w-5 text-cyan-400 shrink-0" />}
              <p className="text-xs font-medium text-slate-100">{t.message}</p>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-slate-400 hover:text-white shrink-0 ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
