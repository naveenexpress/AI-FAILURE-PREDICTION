import type {
  Machine,
  SensorReading,
  Prediction,
  Alert,
  MaintenanceRecommendation,
  DashboardStats,
  ModelInfo,
  ReportSummary
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    
    if (!res.ok) {
      let errorMsg = `Request failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.detail) {
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMsg = errorData.message;
        }
      } catch {
        // use default status error
      }
      throw new Error(errorMsg);
    }

    return await res.json() as T;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Cannot connect to backend server. Please verify backend is running on port 8000.');
    }
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; database: string; model: any; version: string }>('/health'),

  // Machines
  getMachines: (q?: string, status?: string) => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (status && status !== 'ALL') params.append('status', status);
    return request<Machine[]>(`/machines?${params.toString()}`);
  },

  getMachineDetails: (machineId: string) => 
    request<{
      machine: Machine;
      readings: SensorReading[];
      predictions: Prediction[];
      active_alerts: Alert[];
      recommendations: MaintenanceRecommendation[];
    }>(`/machines/${machineId}`),

  createMachine: (data: Partial<Machine>) =>
    request<Machine>('/machines', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMachine: (machineId: string, data: Partial<Machine>) =>
    request<Machine>(`/machines/${machineId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteMachine: (machineId: string, force = false) =>
    request<{ success: boolean; message: string }>(`/machines/${machineId}?force=${force}`, {
      method: 'DELETE',
    }),

  // Sensor Readings
  getMachineReadings: (machineId: string, limit = 50) =>
    request<SensorReading[]>(`/machines/${machineId}/readings?limit=${limit}`),

  submitReading: (data: {
    machine_id: string;
    temperature: number;
    vibration: number;
    rotational_speed: number;
    pressure: number;
    operating_hours: number;
    is_simulated?: boolean;
  }) =>
    request<SensorReading>('/readings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLatestReadings: () => request<SensorReading[]>('/readings/latest'),

  // AI Predictions
  predict: (data: {
    machine_id?: string;
    temperature: number;
    vibration: number;
    rotational_speed: number;
    pressure: number;
    operating_hours: number;
  }) =>
    request<Prediction>('/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPredictions: (limit = 50) => request<Prediction[]>(`/predictions?limit=${limit}`),

  getMachinePredictions: (machineId: string, limit = 50) =>
    request<Prediction[]>(`/machines/${machineId}/predictions?limit=${limit}`),

  // Alerts
  getAlerts: (params: { machine_id?: string; severity?: string; acknowledged?: boolean; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.machine_id) query.append('machine_id', params.machine_id);
    if (params.severity && params.severity !== 'ALL') query.append('severity', params.severity);
    if (params.acknowledged !== undefined) query.append('acknowledged', String(params.acknowledged));
    if (params.limit) query.append('limit', String(params.limit));
    return request<Alert[]>(`/alerts?${query.toString()}`);
  },

  acknowledgeAlert: (alertId: number) =>
    request<{ success: boolean; message: string; alert: Alert }>(`/alerts/${alertId}/acknowledge`, {
      method: 'PATCH',
    }),

  // Maintenance Recommendations
  getMaintenanceRecommendations: (params: { machine_id?: string; category?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.machine_id) query.append('machine_id', params.machine_id);
    if (params.category && params.category !== 'ALL') query.append('category', params.category);
    return request<MaintenanceRecommendation[]>(`/maintenance/recommendations?${query.toString()}`);
  },

  // Machine Learning Model
  getModelInfo: () => request<ModelInfo>('/model/info'),

  trainModel: (params: { n_samples?: number; random_seed?: number } = {}) =>
    request<{ success: boolean; message: string; metrics: any; trained_at: string; version: string }>('/model/train', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Dashboard Stats
  getDashboardStats: () => request<DashboardStats>('/dashboard/stats'),

  // Sensor Simulator
  simulateSensors: (params: { machine_id?: string; mode?: 'normal' | 'warning' | 'critical' | 'random' } = {}) =>
    request<{ success: boolean; mode: string; simulated_count: number; results: any[] }>('/simulator/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Reports
  getReportsSummary: (params: { machine_id?: string; start_date?: string; end_date?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.machine_id) query.append('machine_id', params.machine_id);
    if (params.start_date) query.append('start_date', params.start_date);
    if (params.end_date) query.append('end_date', params.end_date);
    return request<ReportSummary>(`/reports/summary?${query.toString()}`);
  },

  getReadingsCsvUrl: (machineId?: string, startDate?: string, endDate?: string) => {
    const query = new URLSearchParams();
    if (machineId && machineId !== 'ALL') query.append('machine_id', machineId);
    if (startDate) query.append('start_date', startDate);
    if (endDate) query.append('end_date', endDate);
    return `${API_BASE_URL}/reports/readings.csv?${query.toString()}`;
  },

  getAlertsCsvUrl: (machineId?: string, startDate?: string, endDate?: string) => {
    const query = new URLSearchParams();
    if (machineId && machineId !== 'ALL') query.append('machine_id', machineId);
    if (startDate) query.append('start_date', startDate);
    if (endDate) query.append('end_date', endDate);
    return `${API_BASE_URL}/reports/alerts.csv?${query.toString()}`;
  },
};
