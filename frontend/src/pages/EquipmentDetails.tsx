import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Play,
  RotateCw,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../api/client';
import type { Machine, SensorReading, Prediction, Alert, MaintenanceRecommendation } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface EquipmentDetailsProps {
  machineId: string;
  onBack: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const EquipmentDetails: React.FC<EquipmentDetailsProps> = ({
  machineId,
  onBack,
  onToast,
}) => {
  const [data, setData] = useState<{
    machine: Machine;
    readings: SensorReading[];
    predictions: Prediction[];
    active_alerts: Alert[];
    recommendations: MaintenanceRecommendation[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectMode, setInjectMode] = useState<'normal' | 'warning' | 'critical'>('normal');

  const fetchDetails = async () => {
    try {
      const res = await api.getMachineDetails(machineId);
      setData(res);
    } catch (err: any) {
      onToast(err.message || 'Failed to load equipment telemetry details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    const interval = setInterval(fetchDetails, 8000);
    return () => clearInterval(interval);
  }, [machineId]);

  const handleInjectTelemetry = async () => {
    setIsInjecting(true);
    try {
      await api.simulateSensors({ machine_id: machineId, mode: injectMode });
      onToast(`New ${injectMode} sensor reading simulated and evaluated.`, 'success');
      fetchDetails();
    } catch (err: any) {
      onToast(err.message || 'Failed to inject telemetry.', 'error');
    } finally {
      setIsInjecting(false);
    }
  };

  const handleAcknowledge = async (alertId: number) => {
    try {
      await api.acknowledgeAlert(alertId);
      onToast('Alert acknowledged.', 'success');
      fetchDetails();
    } catch (err: any) {
      onToast(err.message || 'Failed to acknowledge alert.', 'error');
    }
  };

  if (loading && !data) {
    return <LoadingSpinner size="lg" message={`Loading ${machineId} telemetry stream...`} />;
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Machine not found or unable to load details.</p>
        <button
          onClick={onBack}
          className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Fleet
        </button>
      </div>
    );
  }

  const { machine, readings, predictions, active_alerts, recommendations } = data;
  const latestPred = predictions[0];
  const health = latestPred?.health_score ?? 100;
  const risk = latestPred?.failure_risk_score ?? 0;

  // Chart data formatting
  const chartData = readings.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString(),
    temperature: r.temperature,
    vibration: r.vibration,
    pressure: r.pressure,
    speed: r.rotational_speed,
  }));

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">{machine.name}</h2>
              <span className="font-mono text-xs text-cyan-400 font-semibold">({machine.id})</span>
              <StatusBadge status={machine.status} size="sm" />
            </div>
            <p className="text-xs text-slate-400">
              {machine.type} • {machine.location || 'Unassigned'} • Installed {machine.installation_date || 'N/A'}
            </p>
          </div>
        </div>

        {/* Telemetry Injection Bar for this equipment */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 p-1.5 shadow-sm">
          <Sliders className="h-4 w-4 text-slate-400 ml-1.5" />
          <span className="text-xs text-slate-300 font-medium">Inject:</span>
          <select
            value={injectMode}
            onChange={(e) => setInjectMode(e.target.value as any)}
            className="rounded bg-slate-950 px-2 py-1 text-xs text-slate-200 border border-slate-800 focus:outline-none"
          >
            <option value="normal">Normal Telemetry</option>
            <option value="warning">Warning Escalation</option>
            <option value="critical">Critical Spike</option>
          </select>
          <button
            onClick={handleInjectTelemetry}
            disabled={isInjecting}
            className="flex items-center gap-1.5 rounded bg-cyan-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 disabled:opacity-50"
          >
            {isInjecting ? <RotateCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
            <span>Simulate</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Condition Status</p>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={latestPred?.predicted_condition || machine.status} size="md" />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Evaluated by Scikit-Learn RF</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Health Index</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{health}%</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full ${health >= 80 ? 'bg-emerald-500' : health >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${health}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Failure Risk Index</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${
                risk >= 70 ? 'text-rose-400' : risk >= 30 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {risk}%
            </span>
            <span className="text-xs text-slate-500">(Demonstration)</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Synthetic probability estimate</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Telemetry Data Points</p>
          <p className="mt-2 text-2xl font-bold text-white">{readings.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">Saved in SQLite table</p>
        </div>
      </div>

      {/* Historical Telemetry Chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Historical Telemetry Stream</h3>
            <p className="text-xs text-slate-400">
              Sensor readings across Temperature (°C), Vibration (mm/s), and Pressure (bar)
            </p>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">
            Live Stream
          </span>
        </div>

        <div className="h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°C)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="vibration"
                  name="Vibration (mm/s)"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="pressure"
                  name="Pressure (bar)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              No historical sensor telemetry recorded yet for this equipment.
            </div>
          )}
        </div>
      </div>

      {/* Grid: Health Deductions & Active Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contributing Conditions */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Sensor Condition Factors</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Algorithmic factors driving the deterministic health index
          </p>

          {latestPred?.contributing_factors && latestPred.contributing_factors.length > 0 ? (
            <ul className="space-y-2">
              {latestPred.contributing_factors.map((factor, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-xs text-slate-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">No adverse operating factors recorded.</p>
          )}
        </div>

        {/* Active Alerts for this Machine */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Active Equipment Alerts</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">{active_alerts.length} Active</span>
          </div>

          {active_alerts.length > 0 ? (
            <div className="space-y-2.5">
              {active_alerts.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={a.severity} size="sm" />
                      <span className="font-mono text-white font-semibold">{a.alert_type}</span>
                    </div>
                    <p className="mt-1 text-slate-300">{a.description}</p>
                    <p className="mt-1 text-[11px] text-cyan-400">Action: {a.recommended_action}</p>
                  </div>
                  <button
                    onClick={() => handleAcknowledge(a.id)}
                    className="shrink-0 rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[11px] font-semibold text-cyan-400 hover:bg-slate-700"
                  >
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800/40 bg-slate-950/30 p-6 text-center text-xs text-slate-500">
              No active alerts for this equipment.
            </div>
          )}
        </div>
      </div>

      {/* Recommended Maintenance Actions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-1">Preventative Maintenance Actions</h3>
        <p className="text-xs text-slate-400 mb-4">
          Non-destructive inspection recommendations derived from sensor envelope rules
        </p>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{rec.title}</span>
                  <StatusBadge status={rec.priority} size="sm" />
                </div>
                <p className="text-slate-300 leading-relaxed font-medium">{rec.action_required}</p>
                <p className="text-[11px] text-slate-500 pt-1">Reason: {rec.rationale}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No scheduled actions required at this time.</p>
        )}
      </div>
    </div>
  );
};
