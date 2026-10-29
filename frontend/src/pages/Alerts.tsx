import React, { useState, useEffect } from 'react';
import {
  Filter,
  Download,
  Check
} from 'lucide-react';
import { api } from '../api/client';
import type { Alert, Machine } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

interface AlertsProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Alerts: React.FC<AlertsProps> = ({ onToast }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [machineFilter, setMachineFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED'>('ALL');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const ackParam =
        statusFilter === 'ACTIVE' ? false : statusFilter === 'ACKNOWLEDGED' ? true : undefined;

      const [alertsData, machinesData] = await Promise.all([
        api.getAlerts({
          machine_id: machineFilter || undefined,
          severity: severityFilter,
          acknowledged: ackParam,
          limit: 100,
        }),
        api.getMachines(),
      ]);
      setAlerts(alertsData);
      setMachines(machinesData);
    } catch (err: any) {
      onToast(err.message || 'Failed to fetch alerts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [machineFilter, severityFilter, statusFilter]);

  const handleAcknowledge = async (alertId: number) => {
    try {
      await api.acknowledgeAlert(alertId);
      onToast(`Alert #${alertId} successfully marked as acknowledged.`, 'success');
      fetchAlerts();
    } catch (err: any) {
      onToast(err.message || 'Failed to acknowledge alert.', 'error');
    }
  };

  const handleExportCsv = () => {
    const url = api.getAlertsCsvUrl(machineFilter || undefined);
    window.open(url, '_blank');
    onToast('Exporting equipment alerts to CSV file...', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Equipment Condition Alerts Log
          </h2>
          <p className="text-xs text-slate-400">
            Real-time threshold breaches, abnormal vibrations, and AI predictive warning alarms.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
        >
          <Download className="h-4 w-4" />
          <span>Export Alerts CSV</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="font-semibold text-slate-300">Filters:</span>
        </div>

        {/* Machine Selector */}
        <select
          value={machineFilter}
          onChange={(e) => setMachineFilter(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Machines</option>
          {machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.id})
            </option>
          ))}
        </select>

        {/* Severity Selector */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="ALL">All Severities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>

        {/* Status Selector */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="ALL">All States</option>
          <option value="ACTIVE">Active (Unacknowledged)</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
        </select>
      </div>

      {/* Alerts Feed */}
      {loading ? (
        <LoadingSpinner message="Loading alert entries..." />
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No Alerts Found"
          description="No alerts match the selected criteria. All monitored equipment is operating within tolerances."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Equipment</th>
                  <th className="py-3 px-4">Alert Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Recommended Action</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-855">
                {alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <StatusBadge status={a.severity} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {a.machine_name}
                      <span className="block font-mono text-[11px] text-cyan-400 font-normal">
                        {a.machine_id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {a.alert_type}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs leading-relaxed">
                      {a.description}
                    </td>
                    <td className="py-3.5 px-4 text-cyan-300 font-medium max-w-xs leading-relaxed">
                      {a.recommended_action}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {a.is_acknowledged ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                          <Check className="h-3.5 w-3.5" />
                          <span>Acknowledged</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAcknowledge(a.id)}
                          className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition"
                        >
                          Acknowledge
                        </button>
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
