import React from 'react';
import type { EquipmentStatus, AlertSeverity } from '../types';

interface StatusBadgeProps {
  status: EquipmentStatus | AlertSeverity | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
}) => {
  const norm = (status || '').toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';

  if (norm === 'NORMAL' || norm === 'LOW' || norm === 'HEALTHY' || norm === 'OPTIMAL') {
    styles = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-emerald-950/20';
    dotColor = 'bg-emerald-400 shadow-[0_0_8px_#34d399]';
  } else if (norm === 'WARNING' || norm === 'MEDIUM' || norm === 'MODERATE') {
    styles = 'bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-amber-950/20';
    dotColor = 'bg-amber-400 shadow-[0_0_8px_#fbbf24]';
  } else if (norm === 'HIGH RISK' || norm === 'HIGH' || norm === 'CRITICAL') {
    styles = 'bg-rose-950/60 text-rose-300 border-rose-500/40 shadow-rose-950/20';
    dotColor = 'bg-rose-400 shadow-[0_0_8px_#f87171] animate-pulse';
  } else if (norm === 'OFFLINE') {
    styles = 'bg-slate-900 text-slate-400 border-slate-700';
    dotColor = 'bg-slate-500';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-sm tracking-wide ${sizeClasses} ${styles}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {norm}
    </span>
  );
};
