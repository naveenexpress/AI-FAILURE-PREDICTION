import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Cpu,
  Info
} from 'lucide-react';
import { api } from '../api/client';
import type { Machine, Prediction } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface AIPredictionsProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AIPredictions: React.FC<AIPredictionsProps> = ({ onToast }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [history, setHistory] = useState<Prediction[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);

  // Sandbox inputs
  const [inputMachineId, setInputMachineId] = useState('');
  const [temperature, setTemperature] = useState(54.0);
  const [vibration, setVibration] = useState(1.7);
  const [rotationalSpeed, setRotationalSpeed] = useState(1500.0);
  const [pressure, setPressure] = useState(3.5);
  const [operatingHours, setOperatingHours] = useState(2500.0);

  // Active prediction result
  const [activeResult, setActiveResult] = useState<Prediction | null>(null);

  const fetchData = async () => {
    try {
      const [mList, pList] = await Promise.all([
        api.getMachines(),
        api.getPredictions(30),
      ]);
      setMachines(mList);
      setHistory(pList);
      if (mList.length > 0 && !inputMachineId) {
        setInputMachineId(mList[0].id);
      }
    } catch (err: any) {
      onToast(err.message || 'Failed to load predictions.', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectPreset = (preset: 'normal' | 'warning' | 'high_risk') => {
    if (preset === 'normal') {
      setTemperature(52.5);
      setVibration(1.6);
      setRotationalSpeed(1500.0);
      setPressure(3.5);
      setOperatingHours(1800.0);
    } else if (preset === 'warning') {
      setTemperature(76.0);
      setVibration(3.9);
      setRotationalSpeed(1380.0);
      setPressure(5.2);
      setOperatingHours(6500.0);
    } else {
      setTemperature(91.0);
      setVibration(6.8);
      setRotationalSpeed(1750.0);
      setPressure(7.6);
      setOperatingHours(9500.0);
    }
  };

  const handleRunPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    try {
      const res = await api.predict({
        machine_id: inputMachineId || undefined,
        temperature: Number(temperature),
        vibration: Number(vibration),
        rotational_speed: Number(rotationalSpeed),
        pressure: Number(pressure),
        operating_hours: Number(operatingHours),
      });
      setActiveResult(res);
      onToast(`Inference complete: Predicted ${res.predicted_condition} with ${res.failure_risk_score}% risk.`, 'success');
      fetchData();
    } catch (err: any) {
      onToast(err.message || 'Prediction failed.', 'error');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">
          AI Failure Risk Prediction Engine
        </h2>
        <p className="text-xs text-slate-400">
          Multi-parameter Random Forest classification model for incipient mechanical degradation detection.
        </p>
      </div>

      {/* Model & Probability Disclaimer Notice */}
      <div className="rounded-xl border border-amber-950 bg-amber-950/20 p-4 text-xs text-amber-200">
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-300">Model Limitations Notice: </span>
            This prototype uses a Scikit-Learn Random Forest Classifier trained on synthetic industrial telemetry.
            Class probabilities and demonstration risk scores represent algorithmic simulation estimates and are not
            certified real-world physical failure probabilities.
          </div>
        </div>
      </div>

      {/* Interactive Prediction Sandbox */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-cyan-400" />
              <span>Interactive Telemetry Inference Sandbox</span>
            </h3>
            <p className="text-xs text-slate-400">
              Inject telemetry features to run live inference against the trained Random Forest classifier.
            </p>
          </div>

          {/* Quick Scenario Preset Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Presets:</span>
            <button
              type="button"
              onClick={() => handleSelectPreset('normal')}
              className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900"
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('warning')}
              className="rounded bg-amber-950/80 border border-amber-500/40 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-900"
            >
              Warning
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('high_risk')}
              className="rounded bg-rose-950/80 border border-rose-500/40 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-900"
            >
              High Risk
            </button>
          </div>
        </div>

        <form onSubmit={handleRunPrediction} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Equipment
              </label>
              <select
                value={inputMachineId}
                onChange={(e) => setInputMachineId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="">(Standalone Test)</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Vibration (mm/s)
              </label>
              <input
                type="number"
                step="0.05"
                required
                value={vibration}
                onChange={(e) => setVibration(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Rotational Speed (RPM)
              </label>
              <input
                type="number"
                step="10"
                required
                value={rotationalSpeed}
                onChange={(e) => setRotationalSpeed(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
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
                value={pressure}
                onChange={(e) => setPressure(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Operating Hours
              </label>
              <input
                type="number"
                step="50"
                required
                value={operatingHours}
                onChange={(e) => setOperatingHours(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPredicting}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-950 hover:bg-cyan-500 disabled:opacity-50"
            >
              <Cpu className="h-4 w-4" />
              <span>{isPredicting ? 'Running Inference...' : 'Execute AI Prediction'}</span>
            </button>
          </div>
        </form>

        {/* Live Prediction Output Box */}
        {activeResult && (
          <div className="mt-6 rounded-xl border border-cyan-500/30 bg-slate-950/80 p-5 shadow-inner">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Inference Result</span>
                <div className="flex items-center gap-3 mt-1">
                  <h4 className="text-lg font-bold text-white">
                    Condition: {activeResult.predicted_condition}
                  </h4>
                  <StatusBadge status={activeResult.predicted_condition} size="md" />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[11px] text-slate-400">Health Index</span>
                  <p className="text-xl font-bold text-white">{activeResult.health_score}%</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Demonstration Risk</span>
                  <p
                    className={`text-xl font-bold ${
                      activeResult.failure_risk_score >= 70
                        ? 'text-rose-400'
                        : activeResult.failure_risk_score >= 30
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {activeResult.failure_risk_score}%
                  </p>
                </div>
              </div>
            </div>

            {/* Class Probabilities */}
            {activeResult.probabilities && (
              <div className="mt-4">
                <span className="text-[11px] font-semibold text-slate-300">
                  Model Class Softmax Probabilities:
                </span>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {Object.entries(activeResult.probabilities).map(([cName, prob]) => (
                    <div key={cName} className="rounded-lg bg-slate-900 p-2.5 text-xs border border-slate-800">
                      <div className="flex justify-between text-slate-300">
                        <span>{cName}</span>
                        <span className="font-mono font-bold">{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            cName === 'NORMAL'
                              ? 'bg-emerald-500'
                              : cName === 'WARNING'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${prob * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Factors & Recommendations */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="text-[11px] font-semibold text-slate-300">Contributing Factors:</span>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                  {activeResult.contributing_factors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-300">
                  Preventive Recommendations:
                </span>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                  {activeResult.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Historical Predictions Log */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-3">
          Historical Prediction Telemetry Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Equipment</th>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Condition</th>
                <th className="py-2.5 px-3">Failure Risk</th>
                <th className="py-2.5 px-3">Health Score</th>
                <th className="py-2.5 px-3">Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-855">
              {history.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-slate-500">#{p.id}</td>
                  <td className="py-2.5 px-3 font-medium text-white">{p.machine_id || 'Standalone'}</td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {new Date(p.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={p.predicted_condition} size="sm" />
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-semibold ${
                        p.failure_risk_score >= 70
                          ? 'text-rose-400'
                          : p.failure_risk_score >= 30
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {p.failure_risk_score}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white">{p.health_score}%</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">{p.model_version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
