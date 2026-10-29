import React, { useState, useEffect } from 'react';
import {
  Activity,
  Thermometer,
  Zap,
  Gauge,
  Clock,
  Play,
  RotateCw,
  SlidersHorizontal,
  Info,
  CheckCircle2
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
import type { Machine, SensorReading } from '../types';

interface SensorMonitoringProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SensorMonitoring: React.FC<SensorMonitoringProps> = ({ onToast }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simMode, setSimMode] = useState<'normal' | 'warning' | 'critical'>('normal');

  // Manual submission form state
  const [manualForm, setManualForm] = useState({
    temperature: 55.0,
    vibration: 1.8,
    rotational_speed: 1500.0,
    pressure: 3.5,
    operating_hours: 2500.0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInitial = async () => {
    try {
      const mList = await api.getMachines();
      setMachines(mList);
      if (mList.length > 0 && !selectedMachineId) {
        setSelectedMachineId(mList[0].id);
      }
    } catch (err: any) {
      onToast(err.message || 'Failed to fetch equipment list.', 'error');
    }
  };

  const fetchReadings = async () => {
    if (!selectedMachineId) return;
    try {
      const data = await api.getMachineReadings(selectedMachineId, 40);
      setReadings(data);
    } catch (err: any) {
      onToast(err.message || 'Failed to fetch telemetry readings.', 'error');
    }
  };

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    if (selectedMachineId) {
      fetchReadings();
      const interval = setInterval(fetchReadings, 6000);
      return () => clearInterval(interval);
    }
  }, [selectedMachineId]);

  const handleSimulate = async () => {
    if (!selectedMachineId) return;
    setIsSimulating(true);
    try {
      await api.simulateSensors({ machine_id: selectedMachineId, mode: simMode });
      onToast(`Generated ${simMode} reading for ${selectedMachineId}.`, 'success');
      fetchReadings();
    } catch (err: any) {
      onToast(err.message || 'Simulation failed.', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachineId) return;
    setIsSubmitting(true);
    try {
      await api.submitReading({
        machine_id: selectedMachineId,
        temperature: Number(manualForm.temperature),
        vibration: Number(manualForm.vibration),
        rotational_speed: Number(manualForm.rotational_speed),
        pressure: Number(manualForm.pressure),
        operating_hours: Number(manualForm.operating_hours),
        is_simulated: true,
      });
      onToast('Telemetry reading recorded and AI prediction executed.', 'success');
      fetchReadings();
    } catch (err: any) {
      onToast(err.message || 'Failed to record reading.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const latest = readings[0];
  const chartData = [...readings].reverse().map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString(),
    temperature: r.temperature,
    vibration: r.vibration,
    pressure: r.pressure,
    speed: r.rotational_speed,
  }));

  return (
    <div className="space-y-6">
      {/* Header & Machine Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Sensor Telemetry Monitoring & Simulator
          </h2>
          <p className="text-xs text-slate-400">
            Real-time multi-channel sensor telemetry streams, historical trends, and synthetic simulation generator.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-300">Select Equipment:</label>
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none"
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Illustrative Threshold Disclaimer */}
      <div className="rounded-xl border border-cyan-950 bg-cyan-950/30 p-4 text-xs text-cyan-200">
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-cyan-300">Engineering Specification Notice: </span>
            The sensor operational thresholds (e.g. Temperature max 70°C, Vibration max 3.0 mm/s, Pressure 2.0-5.5 bar)
            are illustrative thresholds configured for demonstration simulation. In a real-world plant deployment,
            thresholds must be calibrated to individual manufacturer nameplate data and ISO 10816 vibration severity standards.
            All telemetry displayed below is generated by the synthetic simulation engine.
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Temperature</span>
            <Thermometer className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {latest ? `${latest.temperature}°C` : '--'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Nominal: ≤ 70.0°C</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Vibration</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {latest ? `${latest.vibration} mm/s` : '--'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Nominal: ≤ 3.0 mm/s</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Rotational Speed</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {latest ? `${latest.rotational_speed} RPM` : '--'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Design speed band</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Pressure</span>
            <Gauge className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {latest ? `${latest.pressure} bar` : '--'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Nominal: 2.0 - 5.5 bar</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Operating Hours</span>
            <Clock className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {latest ? `${latest.operating_hours} hrs` : '--'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Cumulative runtime</p>
        </div>
      </div>

      {/* Simulator Controls & Manual Input Side-by-Side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Synthetic Simulator Control */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Synthetic Telemetry Generator</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Inject synthetic operating scenarios to test AI failure detection and automated alert mechanisms.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Simulation Profile:
              </label>
              <select
                value={simMode}
                onChange={(e) => setSimMode(e.target.value as any)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="normal">Normal Operation (Healthy smooth run)</option>
                <option value="warning">Warning Escalation (Elevated heat & vibration)</option>
                <option value="critical">Critical Spike (Thermal surge & severe vibration)</option>
              </select>
            </div>

            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-cyan-950 hover:bg-cyan-500 disabled:opacity-50"
            >
              {isSimulating ? (
                <RotateCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
              <span>Inject Simulated Telemetry</span>
            </button>
          </div>
        </div>

        {/* Manual Custom Sensor Entry */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm lg:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Manual Sensor Input Submission</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Manually enter specific physical values to evaluate the ML model prediction and alert triggers.
          </p>

          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={manualForm.temperature}
                  onChange={(e) => setManualForm({ ...manualForm, temperature: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Vib (mm/s)
                </label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={manualForm.vibration}
                  onChange={(e) => setManualForm({ ...manualForm, vibration: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Speed (RPM)
                </label>
                <input
                  type="number"
                  step="10"
                  required
                  value={manualForm.rotational_speed}
                  onChange={(e) => setManualForm({ ...manualForm, rotational_speed: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Pressure (bar)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={manualForm.pressure}
                  onChange={(e) => setManualForm({ ...manualForm, pressure: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Runtime (hrs)
                </label>
                <input
                  type="number"
                  step="10"
                  required
                  value={manualForm.operating_hours}
                  onChange={(e) => setManualForm({ ...manualForm, operating_hours: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Submit & Run AI Inference</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Multi-Channel Interactive Sensor Chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Multi-Channel Telemetry Stream
            </h3>
            <p className="text-xs text-slate-400">
              Sensor readings for {machines.find((m) => m.id === selectedMachineId)?.name || selectedMachineId}
            </p>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">
            Last {readings.length} Readings
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
              No telemetry readings available for this equipment.
            </div>
          )}
        </div>
      </div>

      {/* Historical Readings Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-3">
          Historical Sensor Telemetry Log (SQLite)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Temperature</th>
                <th className="py-2.5 px-3">Vibration</th>
                <th className="py-2.5 px-3">Speed</th>
                <th className="py-2.5 px-3">Pressure</th>
                <th className="py-2.5 px-3">Operating Hours</th>
                <th className="py-2.5 px-3">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-855">
              {readings.slice(0, 15).map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-slate-500">#{r.id}</td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {new Date(r.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-amber-400">
                    {r.temperature}°C
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-cyan-400">
                    {r.vibration} mm/s
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {r.rotational_speed} RPM
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400">
                    {r.pressure} bar
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {r.operating_hours} hrs
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-700">
                      Simulated
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
