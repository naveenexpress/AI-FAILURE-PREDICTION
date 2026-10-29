import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  MapPin
} from 'lucide-react';
import { api } from '../api/client';
import type { Machine, EquipmentStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState } from '../components/EmptyState';

interface EquipmentManagementProps {
  onSelectMachine: (machineId: string) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const EquipmentManagement: React.FC<EquipmentManagementProps> = ({
  onSelectMachine,
  onToast,
}) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'Electric Motor',
    location: '',
    installation_date: new Date().toISOString().split('T')[0],
    status: 'NORMAL' as EquipmentStatus,
    description: '',
  });

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const data = await api.getMachines(searchQuery, statusFilter);
      setMachines(data);
    } catch (err: any) {
      onToast(err.message || 'Failed to fetch equipment list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, [searchQuery, statusFilter]);

  const openCreateModal = () => {
    setEditingMachine(null);
    setFormData({
      id: '',
      name: '',
      type: 'Electric Motor',
      location: '',
      installation_date: new Date().toISOString().split('T')[0],
      status: 'NORMAL',
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (m: Machine) => {
    setEditingMachine(m);
    setFormData({
      id: m.id,
      name: m.name,
      type: m.type,
      location: m.location || '',
      installation_date: m.installation_date || '',
      status: m.status,
      description: m.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      onToast('Equipment name is required.', 'error');
      return;
    }

    try {
      if (editingMachine) {
        await api.updateMachine(editingMachine.id, {
          name: formData.name,
          type: formData.type,
          location: formData.location,
          installation_date: formData.installation_date,
          status: formData.status,
          description: formData.description,
        });
        onToast(`Machine '${editingMachine.name}' updated successfully.`, 'success');
      } else {
        await api.createMachine({
          id: formData.id.trim() || undefined,
          name: formData.name,
          type: formData.type,
          location: formData.location,
          installation_date: formData.installation_date,
          status: formData.status,
          description: formData.description,
        });
        onToast('New machine successfully registered in fleet database.', 'success');
      }
      setIsModalOpen(false);
      fetchMachines();
    } catch (err: any) {
      onToast(err.message || 'Failed to save machine.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!machineToDelete) return;
    try {
      await api.deleteMachine(machineToDelete.id, true);
      onToast(`Machine '${machineToDelete.name}' and records removed.`, 'success');
      setMachineToDelete(null);
      fetchMachines();
    } catch (err: any) {
      onToast(err.message || 'Failed to delete machine.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Equipment Fleet Management
          </h2>
          <p className="text-xs text-slate-400">
            Register, configure, and inspect industrial machinery and asset health metrics.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-900/30 transition hover:bg-cyan-500"
        >
          <Plus className="h-4 w-4" />
          <span>Add Equipment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, or type..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="NORMAL">Normal</option>
            <option value="WARNING">Warning</option>
            <option value="HIGH RISK">High Risk</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      {loading ? (
        <LoadingSpinner message="Querying registered equipment..." />
      ) : machines.length === 0 ? (
        <EmptyState
          title="No Equipment Found"
          description="No machinery matches your search criteria. Add new equipment or clear filters."
          actionText="Add New Machine"
          onAction={openCreateModal}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Equipment ID & Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Latest Health</th>
                  <th className="py-3 px-4">Failure Risk</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-855">
                {machines.map((m) => {
                  const pred = m.latest_prediction;
                  const health = pred?.health_score ?? 100;
                  const risk = pred?.failure_risk_score ?? 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{m.name}</div>
                        <div className="font-mono text-[11px] text-cyan-400">{m.id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{m.type}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          <span>{m.location || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={m.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{health}%</span>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={`h-full ${
                                health >= 80 ? 'bg-emerald-500' : health >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${health}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            risk >= 70 ? 'text-rose-400' : risk >= 30 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {risk}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectMachine(m.id)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400"
                            title="Inspect telemetry & details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(m)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-amber-400"
                            title="Edit equipment details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setMachineToDelete(m)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400"
                            title="Delete equipment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Machine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              {editingMachine ? `Edit Equipment: ${editingMachine.name}` : 'Register New Equipment Asset'}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Provide machinery specifications, operating envelope, and plant floor location.
            </p>

            <form onSubmit={handleSaveMachine} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Equipment ID {!editingMachine && '(Optional)'}
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    disabled={!!editingMachine}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="e.g. MCH-006"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Hydraulic Press"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Machine Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Electric Motor">Electric Motor</option>
                    <option value="Centrifugal Pump">Centrifugal Pump</option>
                    <option value="Conveyor System">Conveyor System</option>
                    <option value="Screw Compressor">Screw Compressor</option>
                    <option value="5-Axis CNC Milling">5-Axis CNC Milling</option>
                    <option value="Hydraulic Press">Hydraulic Press</option>
                    <option value="Industrial Fan">Industrial Fan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Plant Floor Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Bay 3 - Substation"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Installation Date
                  </label>
                  <input
                    type="date"
                    value={formData.installation_date}
                    onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Operating Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="WARNING">WARNING</option>
                    <option value="HIGH RISK">HIGH RISK</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Asset Description & Functional Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Primary manufacturing line equipment details..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-medium text-slate-300 hover:bg-slate-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white shadow-md shadow-cyan-950 hover:bg-cyan-500"
                >
                  {editingMachine ? 'Save Changes' : 'Register Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!machineToDelete}
        title="Delete Equipment Asset"
        message={`Are you sure you want to permanently delete equipment '${machineToDelete?.name}' (${machineToDelete?.id})? This will cascade and delete all associated telemetry readings, AI risk predictions, alerts, and maintenance logs.`}
        confirmText="Confirm Permanent Delete"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setMachineToDelete(null)}
      />
    </div>
  );
};
