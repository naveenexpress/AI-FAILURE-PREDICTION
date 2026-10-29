import React, { useState, useEffect } from 'react';
import {
  Download,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../api/client';
import type { ReportSummary, Machine, SensorReading, Prediction, Alert } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface ReportsProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Reports: React.FC<ReportsProps> = ({ onToast }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMachine, setSelectedMachine] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Tabbed view within reports
  const [activeSubTab, setActiveSubTab] = useState<'readings' | 'predictions' | 'alerts'>('readings');
  const [readingsData, setReadingsData] = useState<SensorReading[]>([]);
  const [predictionsData, setPredictionsData] = useState<Prediction[]>([]);
  const [alertsData, setAlertsData] = useState<Alert[]>([]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [mList, sumData] = await Promise.all([
        api.getMachines(),
        api.getReportsSummary({
          machine_id: selectedMachine === 'ALL' ? undefined : selectedMachine,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
      ]);
      setMachines(mList);
      setSummary(sumData);

      // Fetch subtab content
      if (selectedMachine !== 'ALL') {
        const [rList, pList, aList] = await Promise.all([
          api.getMachineReadings(selectedMachine, 30),
          api.getMachinePredictions(selectedMachine, 30),
          api.getAlerts({ machine_id: selectedMachine, limit: 30 }),
        ]);
        setReadingsData(rList);
        setPredictionsData(pList);
        setAlertsData(aList);
      } else {
        const [rList, pList, aList] = await Promise.all([
          api.getLatestReadings(),
          api.getPredictions(30),
          api.getAlerts({ limit: 30 }),
        ]);
        setReadingsData(rList);
        setPredictionsData(pList);
        setAlertsData(aList);
      }
    } catch (err: any) {
      onToast(err.message || 'Failed to load reports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedMachine, startDate, endDate]);

  const handleExportReadings = () => {
    const url = api.getReadingsCsvUrl(
      selectedMachine === 'ALL' ? undefined : selectedMachine,
      startDate || undefined,
      endDate || undefined
    );
    window.open(url, '_blank');
    onToast('Exporting sensor telemetry to CSV...', 'info');
  };

  const handleExportAlerts = () => {
    const url = api.getAlertsCsvUrl(
      selectedMachine === 'ALL' ? undefined : selectedMachine,
      startDate || undefined,
      endDate || undefined
    );
    window.open(url, '_blank');
    onToast('Exporting alerts log to CSV...', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Telemetry & Predictive Analytics Reports
          </h2>
          <p className="text-xs text-slate-400">
            Generate audit logs, analyze failure risk trends, and export CSV reports for external analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportReadings}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            <Download className="h-4 w-4 text-cyan-400" />
            <span>Readings CSV</span>
          </button>
          <button
            onClick={handleExportAlerts}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            <FileSpreadsheet className="h-4 w-4 text-amber-400" />
            <span>Alerts CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="font-semibold text-slate-300">Filters:</span>
        </div>

        {/* Machine Selector */}
        <select
          value={selectedMachine}
          onChange={(e) => setSelectedMachine(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="ALL">All Equipment</option>
          {machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.id})
            </option>
          ))}
        </select>

        {/* Start Date */}
        <div className="flex items-center gap-1 text-slate-400">
          <span>From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-1 text-slate-400">
          <span>To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {(startDate || endDate || selectedMachine !== 'ALL') && (
          <button
            onClick={() => {
              setSelectedMachine('ALL');
              setStartDate('');
              setEndDate('');
            }}
            className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-400 hover:text-white"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-bold uppercase text-slate-400">Total Telemetry</p>
          <p className="mt-1.5 text-xl font-bold text-white">{summary?.total_sensor_readings ?? 0}</p>
          <p className="text-[10px] text-slate-500">Readings in range</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-bold uppercase text-slate-400">Predictions</p>
          <p className="mt-1.5 text-xl font-bold text-white">{summary?.total_predictions ?? 0}</p>
          <p className="text-[10px] text-slate-500">Inference runs</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-bold uppercase text-slate-400">Total Alerts</p>
          <p className="mt-1.5 text-xl font-bold text-white">{summary?.total_alerts ?? 0}</p>
          <p className="text-[10px] text-slate-500">Recorded alarms</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-bold uppercase text-slate-400">Unacknowledged</p>
          <p className="mt-1.5 text-xl font-bold text-rose-400">{summary?.unacknowledged_alerts ?? 0}</p>
          <p className="text-[10px] text-slate-500">Pending review</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-bold uppercase text-slate-400">Avg Failure Risk</p>
          <p className="mt-1.5 text-xl font-bold text-amber-400">{summary?.average_failure_risk_score ?? 0}%</p>
          <p className="text-[10px] text-slate-500">Synthetic probability</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] font-bold uppercase text-slate-400">Avg Health Index</p>
          <p className="mt-1.5 text-xl font-bold text-emerald-400">{summary?.average_health_score ?? 100}%</p>
          <p className="text-[10px] text-slate-500">Deterministic score</p>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="border-b border-slate-800">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveSubTab('readings')}
            className={`pb-3 text-xs font-semibold border-b-2 transition ${
              activeSubTab === 'readings'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sensor Telemetry Log ({readingsData.length})
          </button>
          <button
            onClick={() => setActiveSubTab('predictions')}
            className={`pb-3 text-xs font-semibold border-b-2 transition ${
              activeSubTab === 'predictions'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Risk Predictions ({predictionsData.length})
          </button>
          <button
            onClick={() => setActiveSubTab('alerts')}
            className={`pb-3 text-xs font-semibold border-b-2 transition ${
              activeSubTab === 'alerts'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Alert History ({alertsData.length})
          </button>
        </div>
      </div>

      {/* Subtab Content */}
      {loading ? (
        <LoadingSpinner message="Generating report data..." />
      ) : activeSubTab === 'readings' ? (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Machine ID</th>
                  <th className="py-2.5 px-3">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">Temperature</th>
                  <th className="py-2.5 px-3">Vibration</th>
                  <th className="py-2.5 px-3">Speed</th>
                  <th className="py-2.5 px-3">Pressure</th>
                  <th className="py-2.5 px-3">Runtime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-855">
                {readingsData.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-mono text-slate-500">#{r.id}</td>
                    <td className="py-2 px-3 font-mono text-cyan-400 font-semibold">{r.machine_id}</td>
                    <td className="py-2 px-3 text-slate-400">{new Date(r.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-3 text-amber-400 font-semibold">{r.temperature}°C</td>
                    <td className="py-2 px-3 text-cyan-400 font-semibold">{r.vibration} mm/s</td>
                    <td className="py-2 px-3 text-slate-300">{r.rotational_speed} RPM</td>
                    <td className="py-2 px-3 text-emerald-400">{r.pressure} bar</td>
                    <td className="py-2 px-3 text-slate-400">{r.operating_hours} hrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeSubTab === 'predictions' ? (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Machine ID</th>
                  <th className="py-2.5 px-3">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">Condition</th>
                  <th className="py-2.5 px-3">Failure Risk</th>
                  <th className="py-2.5 px-3">Health Score</th>
                  <th className="py-2.5 px-3">Model</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-855">
                {predictionsData.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-mono text-slate-500">#{p.id}</td>
                    <td className="py-2 px-3 font-mono text-cyan-400 font-semibold">{p.machine_id}</td>
                    <td className="py-2 px-3 text-slate-400">{new Date(p.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <StatusBadge status={p.predicted_condition} size="sm" />
                    </td>
                    <td className="py-2 px-3 font-semibold text-white">{p.failure_risk_score}%</td>
                    <td className="py-2 px-3 font-semibold text-white">{p.health_score}%</td>
                    <td className="py-2 px-3 font-mono text-slate-400">{p.model_version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Equipment</th>
                  <th className="py-2.5 px-3">Alert Type</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-855">
                {alertsData.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3">
                      <StatusBadge status={a.severity} size="sm" />
                    </td>
                    <td className="py-2 px-3 font-semibold text-white">{a.machine_name}</td>
                    <td className="py-2 px-3 font-mono text-slate-300">{a.alert_type}</td>
                    <td className="py-2 px-3 text-slate-300 max-w-sm truncate">{a.description}</td>
                    <td className="py-2 px-3 text-slate-400">{new Date(a.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-3">
                      {a.is_acknowledged ? (
                        <span className="text-emerald-400 font-medium">Acknowledged</span>
                      ) : (
                        <span className="text-rose-400 font-semibold">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
