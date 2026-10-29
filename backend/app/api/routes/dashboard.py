import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.db.models import Machine, SensorReading, Prediction, Alert
from app.schemas.schemas import DashboardStatsResponse, AlertResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_statistics(db: Session = Depends(get_db)):
    """
    Computes real-time dynamic dashboard summary metrics across all machines,
    including status counts, average health score, distributions, recent alerts, and sensor trends.
    """
    machines = db.query(Machine).all()
    total_machines = len(machines)

    normal_machines = 0
    warning_machines = 0
    high_risk_machines = 0
    health_scores = []

    # Distribution buckets
    # Health: 80-100 (Optimal), 60-79 (Moderate), <60 (Critical)
    health_dist = {"optimal": 0, "moderate": 0, "critical": 0}
    # Risk: Low (<30%), Medium (30-69%), High (70-100%)
    risk_dist = {"low": 0, "medium": 0, "high": 0}

    for m in machines:
        if m.status == "NORMAL":
            normal_machines += 1
        elif m.status == "WARNING":
            warning_machines += 1
        elif m.status == "HIGH RISK":
            high_risk_machines += 1

        latest_pred = db.query(Prediction).filter(
            Prediction.machine_id == m.id
        ).order_by(Prediction.timestamp.desc()).first()

        if latest_pred:
            h = latest_pred.health_score
            r = latest_pred.failure_risk_score
            health_scores.append(h)

            if h >= 80:
                health_dist["optimal"] += 1
            elif h >= 60:
                health_dist["moderate"] += 1
            else:
                health_dist["critical"] += 1

            if r < 30:
                risk_dist["low"] += 1
            elif r < 70:
                risk_dist["medium"] += 1
            else:
                risk_dist["high"] += 1
        else:
            # Default fallback for new machine without prediction
            health_scores.append(100.0)
            health_dist["optimal"] += 1
            risk_dist["low"] += 1

    avg_health = round(sum(health_scores) / len(health_scores), 1) if health_scores else 100.0

    # Recent alerts (latest 5 unacknowledged or recent alerts)
    recent_alerts_db = db.query(Alert).order_by(Alert.timestamp.desc()).limit(6).all()
    recent_alerts = [
        AlertResponse.model_validate(a) for a in recent_alerts_db
    ]

    # Sensor trends: latest 20 readings across equipment to display temperature and vibration trajectory
    recent_readings = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).limit(20).all()
    sensor_trends = []
    for r in reversed(recent_readings):
        sensor_trends.append({
            "timestamp": r.timestamp.strftime("%H:%M:%S") if r.timestamp else "",
            "machine_id": r.machine_id,
            "temperature": r.temperature,
            "vibration": r.vibration,
            "pressure": r.pressure,
            "rotational_speed": r.rotational_speed
        })

    return {
        "total_machines": total_machines,
        "normal_machines": normal_machines,
        "warning_machines": warning_machines,
        "high_risk_machines": high_risk_machines,
        "average_health_score": avg_health,
        "latest_update": datetime.datetime.now(datetime.timezone.utc),
        "health_distribution": health_dist,
        "risk_distribution": risk_dist,
        "recent_alerts": recent_alerts,
        "sensor_trends": sensor_trends
    }
