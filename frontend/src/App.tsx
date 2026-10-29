import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import { api } from './api/client';

// Pages
import { Dashboard } from './pages/Dashboard';
import { EquipmentManagement } from './pages/EquipmentManagement';
import { EquipmentDetails } from './pages/EquipmentDetails';
import { SensorMonitoring } from './pages/SensorMonitoring';
import { AIPredictions } from './pages/AIPredictions';
import { Alerts } from './pages/Alerts';
import { MaintenanceRecommendations } from './pages/MaintenanceRecommendations';
import { Reports } from './pages/Reports';
import { ModelInformation } from './pages/ModelInformation';
import { Settings } from './pages/Settings';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const { toasts, addToast, dismissToast } = useToast();

  // Poll system health and active alerts
  const checkSystemStatus = useCallback(async () => {
    try {
      await api.getHealth();
      setIsBackendConnected(true);

      const alerts = await api.getAlerts({ acknowledged: false });
      setActiveAlertsCount(alerts.length);
    } catch {
      setIsBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 10000);
    return () => clearInterval(interval);
  }, [checkSystemStatus, refreshTrigger]);

  const handleSelectMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    setActiveTab('equipment_details');
  };

  const handleBackToFleet = () => {
    setSelectedMachineId(null);
    setActiveTab('equipment');
  };

  const handleGlobalRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAlertsCount={activeAlertsCount}
        isBackendConnected={isBackendConnected}
        onRefreshData={handleGlobalRefresh}
        onToast={addToast}
      />

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab === 'equipment_details' ? 'equipment' : activeTab}
          setActiveTab={(tab) => {
            if (tab !== 'equipment_details') setSelectedMachineId(null);
            setActiveTab(tab);
          }}
          activeAlertsCount={activeAlertsCount}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <Dashboard
              key={refreshTrigger}
              onSelectMachine={handleSelectMachine}
              setActiveTab={setActiveTab}
              onToast={addToast}
            />
          )}

          {activeTab === 'equipment' && (
            <EquipmentManagement
              key={refreshTrigger}
              onSelectMachine={handleSelectMachine}
              onToast={addToast}
            />
          )}

          {activeTab === 'equipment_details' && selectedMachineId && (
            <EquipmentDetails
              key={`${selectedMachineId}-${refreshTrigger}`}
              machineId={selectedMachineId}
              onBack={handleBackToFleet}
              onToast={addToast}
            />
          )}

          {activeTab === 'sensors' && (
            <SensorMonitoring key={refreshTrigger} onToast={addToast} />
          )}

          {activeTab === 'predictions' && (
            <AIPredictions key={refreshTrigger} onToast={addToast} />
          )}

          {activeTab === 'alerts' && (
            <Alerts key={refreshTrigger} onToast={addToast} />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceRecommendations key={refreshTrigger} onToast={addToast} />
          )}

          {activeTab === 'reports' && (
            <Reports key={refreshTrigger} onToast={addToast} />
          )}

          {activeTab === 'model' && (
            <ModelInformation key={refreshTrigger} onToast={addToast} />
          )}

          {activeTab === 'settings' && (
            <Settings onToast={addToast} />
          )}
        </main>
      </div>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
