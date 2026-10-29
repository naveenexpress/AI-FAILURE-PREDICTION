import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Play,
  RotateCw,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeAlertsCount: number;
  isBackendConnected: boolean;
  onRefreshData?: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeAlertsCount,
  isBackendConnected,
  onRefreshData,
  onToast,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simMode, setSimMode] = useState<'normal' | 'warning' | 'critical'>('normal');

  const handleQuickSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await api.simulateSensors({ mode: simMode });
      onToast(`Simulated telemetry recorded for ${res.simulated_count} machines (${simMode} mode).`, 'success');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      onToast(err.message || 'Simulation request failed', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur-md">
      {/* Brand & Prototype Label */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-900/30">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white">
              AI Equipment Failure Prediction System
            </h1>
            <span className="rounded-full bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
              V1.0 PROTOTYPE
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Industrial Sensor Monitoring & Predictive Maintenance AI
          </p>
        </div>
      </div>

      {/* Live Actions & Status */}
      <div className="flex items-center gap-4">
        {/* Synthetic Simulation Notice */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Synthetic Model & Sensor Simulator</span>
        </div>

        {/* Quick Simulator Tool */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/90 p-1">
          <select
            value={simMode}
            onChange={(e) => setSimMode(e.target.value as any)}
            className="rounded bg-slate-950 px-2 py-1 text-xs text-slate-300 border border-slate-800 focus:outline-none"
            title="Select simulated telemetry profile"
          >
            <option value="normal">Normal Mode</option>
            <option value="warning">Warning Surge</option>
            <option value="critical">Critical Spike</option>
          </select>
          <button
            onClick={handleQuickSimulate}
            disabled={isSimulating}
            className="flex items-center gap-1.5 rounded bg-cyan-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-500 disabled:opacity-50"
            title="Inject simulated sensor readings and recalculate risk"
          >
            {isSimulating ? (
              <RotateCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            <span>Inject Telemetry</span>
          </button>
        </div>

        {/* Backend Connectivity Status */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              isBackendConnected
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : 'bg-rose-500 animate-ping'
            }`}
          />
          <span className="font-medium text-slate-300">
            {isBackendConnected ? 'Backend Live' : 'Disconnected'}
          </span>
        </div>

        {/* Active Alerts Pill */}
        {activeAlertsCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/60 px-3 py-1.5 text-xs font-semibold text-rose-300 shadow-sm animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{activeAlertsCount} Active Alert{activeAlertsCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </header>
  );
};
