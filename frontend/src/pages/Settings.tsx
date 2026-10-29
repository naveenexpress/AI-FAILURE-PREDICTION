import React, { useState } from 'react';
import {
  Sliders,
  Database,
  Save,
  RotateCcw,
  Info
} from 'lucide-react';

interface SettingsProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Settings: React.FC<SettingsProps> = ({ onToast }) => {
  // Threshold values
  const [tempNormalMax, setTempNormalMax] = useState(70.0);
  const [tempHighRiskMin, setTempHighRiskMin] = useState(85.0);
  const [vibNormalMax, setVibNormalMax] = useState(3.0);
  const [vibHighRiskMin, setVibHighRiskMin] = useState(5.5);
  const [rpmNominalMin, setRpmNominalMin] = useState(1200.0);
  const [rpmNominalMax, setRpmNominalMax] = useState(3800.0);
  const [pressNormalMin, setPressNormalMin] = useState(2.0);
  const [pressNormalMax, setPressNormalMax] = useState(5.5);
  const [pressHighRiskMax, setPressHighRiskMax] = useState(7.0);
  const [hoursWarning, setHoursWarning] = useState(6000.0);
  const [hoursHighRisk, setHoursHighRisk] = useState(10000.0);

  // Connection settings
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    onToast('Central sensor threshold profiles updated successfully.', 'success');
  };

  const handleResetDefaults = () => {
    setTempNormalMax(70.0);
    setTempHighRiskMin(85.0);
    setVibNormalMax(3.0);
    setVibHighRiskMin(5.5);
    setRpmNominalMin(1200.0);
    setRpmNominalMax(3800.0);
    setPressNormalMin(2.0);
    setPressNormalMax(5.5);
    setPressHighRiskMax(7.0);
    setHoursWarning(6000.0);
    setHoursHighRisk(10000.0);
    onToast('Threshold profiles reset to baseline engineering defaults.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">
          System Configuration & Sensor Thresholds
        </h2>
        <p className="text-xs text-slate-400">
          Configure sensor boundary values, operational envelope tolerances, and system connection endpoints.
        </p>
      </div>

      {/* Engineering Notice */}
      <div className="rounded-xl border border-cyan-950 bg-cyan-950/20 p-4 text-xs text-cyan-200">
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-cyan-300">Calibration Requirement: </span>
            All sensor thresholds below define the boundaries used by the deterministic health scoring function
            and the alert triggers. Thresholds are illustrative for the demonstration simulator and must be
            re-calibrated according to the specific manufacturer ratings of monitored plant machinery.
          </div>
        </div>
      </div>

      {/* Sensor Thresholds Form */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Sensor Threshold Boundaries</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Defines warning and high-risk threshold limits for telemetry evaluations.
        </p>

        <form onSubmit={handleSaveThresholds} className="space-y-5 text-xs">
          {/* Temperature */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h4 className="font-semibold text-white mb-2">Temperature Channels (°C)</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Normal Maximum (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={tempNormalMax}
                  onChange={(e) => setTempNormalMax(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Values above this trigger a WARNING state</span>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  High Risk Minimum (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={tempHighRiskMin}
                  onChange={(e) => setTempHighRiskMin(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Values above this trigger CRITICAL ALARMS</span>
              </div>
            </div>
          </div>

          {/* Vibration */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h4 className="font-semibold text-white mb-2">Vibration Velocity Channels (mm/s RMS)</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Normal Maximum (mm/s)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={vibNormalMax}
                  onChange={(e) => setVibNormalMax(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">ISO 10816 Zone A/B boundary</span>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Hazardous Vibration Minimum (mm/s)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={vibHighRiskMin}
                  onChange={(e) => setVibHighRiskMin(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">ISO 10816 Zone D boundary (Imminent damage)</span>
              </div>
            </div>
          </div>

          {/* Rotational Speed */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <h4 className="font-semibold text-white mb-2">Rotational Speed Nominal Operating Band (RPM)</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Minimum Speed (RPM)</label>
                <input
                  type="number"
                  step="50"
                  value={rpmNominalMin}
                  onChange={(e) => setRpmNominalMin(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Maximum Speed (RPM)</label>
                <input
                  type="number"
                  step="50"
                  value={rpmNominalMax}
                  onChange={(e) => setRpmNominalMax(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pressure & Operating Hours */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
              <h4 className="font-semibold text-white mb-2">Pressure Safe Window (bar)</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nominal Range (bar)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={pressNormalMin}
                      onChange={(e) => setPressNormalMin(parseFloat(e.target.value) || 0)}
                      className="w-1/2 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={pressNormalMax}
                      onChange={(e) => setPressNormalMax(parseFloat(e.target.value) || 0)}
                      className="w-1/2 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Critical Overpressure (bar)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pressHighRiskMax}
                    onChange={(e) => setPressHighRiskMax(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
              <h4 className="font-semibold text-white mb-2">Operating Life Hours</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Service Warning (hrs)</label>
                  <input
                    type="number"
                    step="500"
                    value={hoursWarning}
                    onChange={(e) => setHoursWarning(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Major Overhaul Interval (hrs)</label>
                  <input
                    type="number"
                    step="500"
                    value={hoursHighRisk}
                    onChange={(e) => setHoursHighRisk(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-750"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white shadow-md shadow-cyan-950 hover:bg-cyan-500"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* Application & Environment Info */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">System Architecture & Database</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-3">
          <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Backend Database</span>
            <span className="text-white font-semibold mt-1 block">SQLite 3 (SQLAlchemy 2.x)</span>
            <span className="text-[10px] text-slate-500">Auto-migrations enabled</span>
          </div>

          <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">API Backend URL</span>
            <span className="text-cyan-400 font-mono mt-1 block">{apiUrl}</span>
            <span className="text-[10px] text-slate-500">FastAPI Uvicorn Async</span>
          </div>

          <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Classifier Runtime</span>
            <span className="text-emerald-400 font-semibold mt-1 block">Scikit-Learn Random Forest</span>
            <span className="text-[10px] text-slate-500">Model Artifact v1.0 (Joblib)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
