import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div
            className={`rounded-full p-2.5 ${
              isDestructive
                ? 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>

        <p className="mt-3 text-sm text-slate-300 leading-relaxed">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-750 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/50'
                : 'bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-950/50'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
