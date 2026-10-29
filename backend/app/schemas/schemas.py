import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# --- Machine Schemas ---
class MachineBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    type: str = Field(..., min_length=2, max_length=50)
    location: Optional[str] = Field(None, max_length=100)
    installation_date: Optional[str] = Field(None, max_length=30)
    status: Optional[str] = Field("NORMAL", max_length=20)
    description: Optional[str] = None

class MachineCreate(MachineBase):
    id: Optional[str] = Field(None, max_length=50, description="Optional custom machine ID. If omitted, generated automatically.")

class MachineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    type: Optional[str] = Field(None, min_length=2, max_length=50)
    location: Optional[str] = Field(None, max_length=100)
    installation_date: Optional[str] = Field(None, max_length=30)
    status: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = None

class MachineResponse(MachineBase):
    id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    latest_reading: Optional[Dict[str, Any]] = None
    latest_prediction: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

# --- Sensor Reading Schemas ---
class SensorReadingCreate(BaseModel):
    machine_id: str
    temperature: float = Field(..., description="Temperature in °C")
    vibration: float = Field(..., description="Vibration in mm/s")
    rotational_speed: float = Field(..., description="Rotational speed in RPM")
    pressure: float = Field(..., description="Pressure in bar")
    operating_hours: float = Field(..., ge=0, description="Total cumulative operating hours")
    timestamp: Optional[datetime.datetime] = None
    is_simulated: bool = True

class SensorReadingResponse(BaseModel):
    id: int
    machine_id: str
    timestamp: datetime.datetime
    temperature: float
    vibration: float
    rotational_speed: float
    pressure: float
    operating_hours: float
    is_simulated: bool

    model_config = ConfigDict(from_attributes=True)

# --- Prediction Schemas ---
class PredictionRequest(BaseModel):
    machine_id: Optional[str] = None
    temperature: float
    vibration: float
    rotational_speed: float
    pressure: float
    operating_hours: float

class PredictionResponse(BaseModel):
    id: Optional[int] = None
    machine_id: Optional[str] = None
    timestamp: datetime.datetime
    predicted_condition: str
    failure_risk_score: float
    health_score: float
    probabilities: Optional[Dict[str, float]] = None
    contributing_factors: List[str] = []
    recommendations: List[str] = []
    model_version: str

    model_config = ConfigDict(from_attributes=True)

# --- Alert Schemas ---
class AlertResponse(BaseModel):
    id: int
    machine_id: str
    machine_name: str
    alert_type: str
    severity: str
    description: str
    timestamp: datetime.datetime
    is_acknowledged: bool
    acknowledged_at: Optional[datetime.datetime] = None
    recommended_action: str

    model_config = ConfigDict(from_attributes=True)

class AlertAcknowledgeResponse(BaseModel):
    success: bool
    message: str
    alert: AlertResponse

# --- Maintenance Recommendation Schemas ---
class MaintenanceRecommendationResponse(BaseModel):
    id: int
    machine_id: str
    title: str
    category: str
    priority: str
    action_required: str
    rationale: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- Dashboard & Reports Schemas ---
class DashboardStatsResponse(BaseModel):
    total_machines: int
    normal_machines: int
    warning_machines: int
    high_risk_machines: int
    average_health_score: float
    latest_update: datetime.datetime
    health_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]
    recent_alerts: List[AlertResponse]
    sensor_trends: List[Dict[str, Any]]
