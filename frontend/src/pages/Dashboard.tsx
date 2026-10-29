import React, { useState, useEffect } from 'react';
import {
  Server,
  CheckCircle2,
  AlertTriangle,
  Flame,
  HeartPulse,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { api } from '../api/client';
import type { DashboardStats, Machine } from '../types';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface DashboardProps {
  onSelectMachine: (machineId: string) => void;
  setActiveTab: (tab: string) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectMachine,
  setActiveTab,
  onToast,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [statsData, machinesData] = await Promise.all([
        api.getDashboardStats(),
        api.getMachines(),
      ]);
      setStats(statsData);
      setMachines(machinesData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // 10-second polling for live industrial monitoring
    const timer = setInterval(() => {
      fetchDashboardData();
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      await api.acknowledgeAlert(alertId);
      onToast('Alert marked as acknowledged.', 'success');
      fetchDashboardData();
    } catch (err: any) {
      onToast(err.message || 'Failed to acknowledge alert.', 'error');
    }
  };

  if (loading && !stats) {
    return <LoadingSpinner size="lg" message="Loading industrial telemetry stream..." />;
  }

  const healthData = stats
    ? [
        { name: 'Optimal (80-100)', value: stats.health_distribution.optimal, color: '#10b981' },
        { name: 'Moderate (60-79)', value: stats.health_distribution.moderate, color: '#f59e0b' },
        { name: 'Critical (<60)', value: stats.health_distribution.critical, color: '#ef4444' },
      ]
    : [];

  const riskData = stats
    ? [
        { name: 'Low Risk (<30%)', value: stats.risk_distribution.low, color: '#10b981' },
        { name: 'Medium Risk (30-69%)', value: stats.risk_distribution.medium, color: '#f59e0b' },
        { name: 'High Risk (≥70%)', value: stats.risk_distribution.high, color: '#ef4444' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Industrial Fleet Telemetry Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            Real-time condition monitoring, automated failure risk index, and health telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {stats?.latest_update && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Updated: {new Date(stats.latest_update).toLocaleTimeString()}
              </span>
            </div>
          )}

          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/40 bg-rose-950/60 p-4 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            className="rounded bg-rose-900/60 px-2 py-1 font-semibold hover:bg-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Fleet"
          value={stats?.total_machines ?? 0}
          subtitle="Monitored equipment units"
          icon={Server}
          variant="default"
        />
        <MetricCard
          title="Normal Equipment"
          value={stats?.normal_machines ?? 0}
          subtitle="Nominal operating specs"
          icon={CheckCircle2}
          variant="emerald"
        />
        <MetricCard
          title="Attention Warning"
          value={stats?.warning_machines ?? 0}
          subtitle="Early stage wear detected"
          icon={AlertTriangle}
          variant="amber"
        />
        <MetricCard
          title="High Risk Critical"
          value={stats?.high_risk_machines ?? 0}
          subtitle="Imminent hazard threshold"
          icon={Flame}
          variant="rose"
        />
        <MetricCard
          title="Avg Health Score"
          value={`${stats?.average_health_score ?? 100}%`}
          subtitle="Fleet-wide deterministic index"
          icon={HeartPulse}
          variant="cyan"
        />
      </div>

      {/* Charts Section: Sensor Trends & Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sensor Trends Line Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Live Sensor Telemetry Trends
              </h3>
              <p className="text-xs text-slate-400">
                Temperature (°C) and Vibration (mm/s) trajectory across fleet
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800/80 px-2 py-1 rounded">
              Last 20 Readings
            </span>
          </div>

          <div className="h-64 w-full">
            {stats?.sensor_trends && stats.sensor_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.sensor_trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature (°C)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="vibration"
                    name="Vibration (mm/s)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No telemetry readings recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Health & Risk Distribution */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white">
            Health & Risk Proportions
          </h3>
          <p className="text-xs text-slate-400 mb-2">
            Categorical fleet health & failure risk distribution
          </p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {healthData.map((entry, index) => (
                    <Cell key={`health-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 border-t border-slate-800 pt-2 grid grid-cols-3 text-center text-[10px]">
            <div>
              <span className="text-slate-400 block">Low Risk</span>
              <span className="text-emerald-400 font-bold">{riskData[0]?.value ?? 0}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Medium Risk</span>
              <span className="text-amber-400 font-bold">{riskData[1]?.value ?? 0}</span>
            </div>
            <div>
              <span className="text-slate-400 block">High Risk</span>
              <span className="text-rose-400 font-bold">{riskData[2]?.value ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Fleet Quick Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Equipment Fleet Status
            </h3>
            <p className="text-xs text-slate-400">
              Instant condition overview for all registered machinery
            </p>
          </div>
          <button
            onClick={() => setActiveTab('equipment')}
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
          >
            <span>Manage All Equipment</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {machines.map((m) => {
            const pred = m.latest_prediction;
            const health = pred?.health_score ?? 100;
            const risk = pred?.failure_risk_score ?? 0;

            let healthBarColor = 'bg-emerald-500';
            if (health < 60) healthBarColor = 'bg-rose-500';
            else if (health < 80) healthBarColor = 'bg-amber-500';

            return (
              <div
                key={m.id}
                onClick={() => onSelectMachine(m.id)}
                className="group relative cursor-pointer rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition-all duration-200 hover:border-cyan-500/50 hover:bg-slate-900/90 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                      {m.id}
                    </span>
                    <h4 className="mt-0.5 text-xs font-bold text-white group-hover:text-cyan-300 truncate max-w-[130px]">
                      {m.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate max-w-[130px]">{m.type}</p>
                  </div>
                  <StatusBadge status={m.status} size="sm" />
                </div>

                {/* Health Score Mini Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                    <span>Health Index</span>
                    <span className="font-bold">{health}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${healthBarColor}`}
                      style={{ width: `${Math.max(5, health)}%` }}
                    />
                  </div>
                </div>

                {/* Failure Risk Indicator */}
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-900 pt-2">
                  <span>Failure Risk</span>
                  <span
                    className={`font-semibold ${
                      risk >= 70 ? 'text-rose-400 font-bold' : risk >= 30 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {risk}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Alerts Feed */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Recent Equipment Alerts
            </h3>
            <p className="text-xs text-slate-400">
              Live anomaly notifications requiring operator attention
            </p>
          </div>
          <button
            onClick={() => setActiveTab('alerts')}
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
          >
            <span>View All Alerts</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {stats?.recent_alerts && stats.recent_alerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Equipment</th>
                  <th className="py-2.5 px-3">Alert Type</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {stats.recent_alerts.slice(0, 5).map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3">
                      <StatusBadge status={a.severity} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">
                      {a.machine_name} <span className="text-slate-500 font-mono">({a.machine_id})</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {a.alert_type}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                      {a.description}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3">
                      {a.is_acknowledged ? (
                        <span className="text-[11px] text-slate-500">Acknowledged</span>
                      ) : (
                        <button
                          onClick={() => handleAcknowledgeAlert(a.id)}
                          className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[11px] font-semibold text-cyan-400 hover:bg-slate-700 hover:text-cyan-300"
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
        ) : (
          <div className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-6 text-center text-xs text-slate-400">
            No active alerts at this time. All machines operating within acceptable envelopes.
          </div>
        )}
      </div>
    </div>
  );
};
