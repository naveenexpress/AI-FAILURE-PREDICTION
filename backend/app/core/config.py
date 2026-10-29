import os
from typing import List
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "AI-Based Equipment Failure Prediction System")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./equipment_failure_prediction.db")
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    MODEL_DIR: str = os.getenv("MODEL_DIR", "app/ml/models")
    RANDOM_SEED: int = int(os.getenv("RANDOM_SEED", "42"))

    # Configurable nominal and critical sensor thresholds for demo/industrial simulation
    TEMP_NORMAL_MAX: float = 70.0
    TEMP_HIGH_RISK_MIN: float = 85.0

    VIB_NORMAL_MAX: float = 3.0
    VIB_HIGH_RISK_MIN: float = 5.5

    RPM_NOMINAL_MIN: float = 1200.0
    RPM_NOMINAL_MAX: float = 3800.0

    PRESSURE_NORMAL_MIN: float = 2.0
    PRESSURE_NORMAL_MAX: float = 5.5
    PRESSURE_HIGH_RISK_MAX: float = 7.0

    HOURS_WARNING_THRESHOLD: float = 6000.0
    HOURS_HIGH_RISK_THRESHOLD: float = 10000.0

settings = Settings()
