export type EquipmentStatus = 'NORMAL' | 'WARNING' | 'HIGH RISK' | 'OFFLINE';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RecommendationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Machine {
  id: string;
  name: string;
  type: string;
  location?: string | null;
  installation_date?: string | null;
  status: EquipmentStatus;
  description?: string | null;
  created_at: string;
  updated_at: string;
  latest_reading?: {
    id: number;
    timestamp: string;
    temperature: number;
    vibration: number;
    rotational_speed: number;
    pressure: number;
    operating_hours: number;
  } | null;
  latest_prediction?: {
    id?: number;
    timestamp: string;
    predicted_condition: EquipmentStatus;
    failure_risk_score: number;
    health_score: number;
    contributing_factors?: string[];
  } | null;
}

export interface SensorReading {
  id: number;
  machine_id: string;
  timestamp: string;
  temperature: number;
  vibration: number;
  rotational_speed: number;
  pressure: number;
  operating_hours: number;
  is_simulated: boolean;
}

export interface Prediction {
  id?: number;
  machine_id?: string;
  timestamp: string;
  predicted_condition: EquipmentStatus;
  failure_risk_score: number;
  health_score: number;
  probabilities?: Record<string, number>;
  contributing_factors: string[];
  recommendations: string[];
  model_version: string;
}

export interface Alert {
  id: number;
  machine_id: string;
  machine_name: string;
  alert_type: string;
  severity: AlertSeverity;
  description: string;
  timestamp: string;
  is_acknowledged: boolean;
  acknowledged_at?: string | null;
  recommended_action: string;
}

export interface MaintenanceRecommendation {
  id: number;
  machine_id: string;
  title: string;
  category: string;
  priority: RecommendationPriority;
  action_required: string;
  rationale: string;
  created_at: string;
}

export interface DashboardStats {
  total_machines: number;
  normal_machines: number;
  warning_machines: number;
  high_risk_machines: number;
  average_health_score: number;
  latest_update: string;
  health_distribution: {
    optimal: number;
    moderate: number;
    critical: number;
  };
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
  };
  recent_alerts: Alert[];
  sensor_trends: Array<{
    timestamp: string;
    machine_id: string;
    temperature: number;
    vibration: number;
    pressure: number;
    rotational_speed: number;
  }>;
}

export interface ModelInfo {
  model_name: string;
  algorithm: string;
  version: string;
  trained_at: string;
  random_seed: number;
  n_samples: number;
  train_size: number;
  test_size: number;
  features: string[];
  classes: string[];
  metrics: {
    accuracy: number;
    precision_macro: number;
    precision_weighted: number;
    recall_macro: number;
    recall_weighted: number;
    f1_macro: number;
    f1_weighted: number;
  };
  confusion_matrix: number[][];
  feature_importances: Record<string, number>;
  hyperparameters: Record<string, any>;
  limitations: string;
}

export interface ReportSummary {
  machine_id: string;
  filter_start?: string;
  filter_end?: string;
  total_sensor_readings: number;
  total_predictions: number;
  total_alerts: number;
  unacknowledged_alerts: number;
  average_failure_risk_score: number;
  average_health_score: number;
}
