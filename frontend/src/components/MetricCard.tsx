import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'emerald' | 'amber' | 'rose' | 'cyan';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
}) => {
  const variantStyles = {
    default: {
      border: 'border-slate-800 hover:border-slate-700',
      iconBg: 'bg-slate-800 text-slate-300',
      glow: '',
    },
    emerald: {
      border: 'border-emerald-900/40 hover:border-emerald-700/50',
      iconBg: 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.08)]',
    },
    amber: {
      border: 'border-amber-900/40 hover:border-amber-700/50',
      iconBg: 'bg-amber-950/80 text-amber-400 border border-amber-500/30',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.08)]',
    },
    rose: {
      border: 'border-rose-900/40 hover:border-rose-700/50',
      iconBg: 'bg-rose-950/80 text-rose-400 border border-rose-500/30',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.08)]',
    },
    cyan: {
      border: 'border-cyan-900/40 hover:border-cyan-700/50',
      iconBg: 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/30',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.08)]',
    },
  }[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-900/80 p-5 backdrop-blur-md transition-all duration-200 border ${variantStyles.border} ${variantStyles.glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
          {trend && (
            <p className="mt-2 flex items-center text-xs font-medium">
              <span className={trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                {trend.value}
              </span>
              <span className="ml-1 text-slate-500">vs nominal</span>
            </p>
          )}
        </div>
        <div className={`rounded-lg p-3 ${variantStyles.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
