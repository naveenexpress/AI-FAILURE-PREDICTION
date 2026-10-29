import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-200">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 focus:outline-none"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
