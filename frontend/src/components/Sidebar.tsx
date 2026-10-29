import React from 'react';
import {
  LayoutDashboard,
  Server,
  Activity,
  BrainCircuit,
  Bell,
  Wrench,
  FileBarChart,
  Cpu,
  Settings as SettingsIcon,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeAlertsCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'equipment', label: 'Equipment Fleet', icon: Server },
    { id: 'sensors', label: 'Sensor Monitoring', icon: Activity },
    { id: 'predictions', label: 'AI Risk Predictions', icon: BrainCircuit },
    {
      id: 'alerts',
      label: 'System Alerts',
      icon: Bell,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
    },
    { id: 'maintenance', label: 'Maintenance Actions', icon: Wrench },
    { id: 'reports', label: 'Reports & Export', icon: FileBarChart },
    { id: 'model', label: 'ML Model Insights', icon: Cpu },
    { id: 'settings', label: 'Thresholds & Config', icon: SettingsIcon },
  ];

  return (
    <aside className="flex flex-col w-64 shrink-0 border-r border-slate-800 bg-slate-950/95 min-h-[calc(100vh-4rem)] p-4">
      {/* Navigation list */}
      <nav className="flex-1 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Navigation
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/40 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className="rounded-full bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Engineering disclaimer card */}
      <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
          <span>Prototype Environment</span>
        </div>
        <p className="mt-1 leading-relaxed text-slate-400">
          Demonstration engineering prototype. Telemetry and failure risk scores are generated synthetically.
        </p>
      </div>
    </aside>
  );
};
