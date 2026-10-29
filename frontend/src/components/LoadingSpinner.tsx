import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading telemetry...',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div
        className={`animate-spin rounded-full border-cyan-500/20 border-t-cyan-400 ${sizeMap}`}
      />
      {message && <p className="mt-3 text-sm text-slate-400">{message}</p>}
    </div>
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/50 p-5">
    <div className="h-4 w-1/3 rounded bg-slate-800" />
    <div className="mt-3 h-8 w-1/2 rounded bg-slate-800" />
    <div className="mt-2 h-3 w-1/4 rounded bg-slate-800/60" />
  </div>
);
