import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Filter,
  Info
} from 'lucide-react';
import { api } from '../api/client';
import type { MaintenanceRecommendation, Machine } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

interface MaintenanceRecommendationsProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MaintenanceRecommendations: React.FC<MaintenanceRecommendationsProps> = ({
  onToast,
}) => {
  const [recommendations, setRecommendations] = useState<MaintenanceRecommendation[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [machineFilter, setMachineFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const [recsData, machinesData] = await Promise.all([
        api.getMaintenanceRecommendations({
          machine_id: machineFilter || undefined,
          category: categoryFilter,
        }),
        api.getMachines(),
      ]);
      setRecommendations(recsData);
      setMachines(machinesData);
    } catch (err: any) {
      onToast(err.message || 'Failed to fetch maintenance recommendations.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecs();
  }, [machineFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">
          Rule-Based Preventive Maintenance Actions
        </h2>
        <p className="text-xs text-slate-400">
          Prescriptive engineering maintenance protocols generated from telemetry boundary rules.
        </p>
      </div>

      {/* Engineering Philosophy Notice */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-white">Non-Destructive Inspection Standard: </span>
            Recommendations follow industrial reliability engineering best practices by directing maintenance crews
            to perform targeted inspections, lubrication servicing, and laser alignment rather than asserting
            unconfirmed physical component failure without diagnostic inspection.
          </div>
        </div>
      </div>

      {/* Category Summary Quick Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {['MECHANICAL', 'THERMAL', 'LUBRICATION', 'ELECTRICAL', 'INSPECTION'].map((cat) => {
          const count = recommendations.filter((r) => r.category === cat).length;
          return (
            <div
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? 'ALL' : cat)}
              className={`cursor-pointer rounded-xl border p-3 transition-all ${
                categoryFilter === cat
                  ? 'border-cyan-500 bg-cyan-950/40 shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase">
                <span>{cat}</span>
                <Wrench className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <p className="mt-2 text-xl font-bold text-white">{count}</p>
              <p className="text-[10px] text-slate-500">Active recommendations</p>
            </div>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="font-semibold text-slate-300">Filters:</span>
        </div>

        <select
          value={machineFilter}
          onChange={(e) => setMachineFilter(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Equipment</option>
          {machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.id})
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          <option value="MECHANICAL">Mechanical</option>
          <option value="THERMAL">Thermal</option>
          <option value="LUBRICATION">Lubrication</option>
          <option value="ELECTRICAL">Electrical</option>
          <option value="INSPECTION">Inspection</option>
        </select>
      </div>

      {/* Recommendations Feed */}
      {loading ? (
        <LoadingSpinner message="Querying maintenance rules..." />
      ) : recommendations.length === 0 ? (
        <EmptyState
          title="No Maintenance Actions Scheduled"
          description="All monitored equipment conditions are normal. Standard routine inspection applies."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm space-y-2.5 transition hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] text-cyan-400 font-semibold uppercase">
                    {rec.machine_id} • {rec.category}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{rec.title}</h3>
                </div>
                <StatusBadge status={rec.priority} size="sm" />
              </div>

              <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-3 text-xs text-slate-200 leading-relaxed font-medium">
                <span className="text-[10px] font-bold uppercase text-cyan-400 block mb-1">
                  Required Action Protocol:
                </span>
                {rec.action_required}
              </div>

              <div className="text-[11px] text-slate-400 pt-1">
                <span className="font-semibold text-slate-300">Engineering Rationale: </span>
                {rec.rationale}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                <span>Created: {new Date(rec.created_at).toLocaleString()}</span>
                <button
                  onClick={() => onToast(`Work order generated for ${rec.machine_id}.`, 'success')}
                  className="rounded bg-slate-800 px-2.5 py-1 text-slate-300 hover:bg-slate-750 hover:text-white"
                >
                  Generate Work Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
