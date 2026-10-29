import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models import Alert, Machine
from app.core.config import settings

def evaluate_and_create_alerts(
    db: Session,
    machine_id: str,
    machine_name: str,
    temperature: float,
    vibration: float,
    rotational_speed: float,
    pressure: float,
    predicted_condition: str,
    failure_risk_score: float
) -> List[Alert]:
    """
    Evaluates sensor readings and ML condition to trigger alerts.
    Prevents duplicate unacknowledged active alerts for the same machine and alert_type.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    candidate_alerts = []

    # 1. Thermal alert
    if temperature > settings.TEMP_HIGH_RISK_MIN:
        candidate_alerts.append({
            "alert_type": "CRITICAL_TEMPERATURE",
            "severity": "CRITICAL",
            "description": f"Critical temperature exceeded: {temperature:.1f}°C (Threshold: {settings.TEMP_HIGH_RISK_MIN}°C)",
            "action": "Immediate cooling check and load reduction. Inspect coolant circuit and lubrication."
        })
    elif temperature > settings.TEMP_NORMAL_MAX:
        candidate_alerts.append({
            "alert_type": "HIGH_TEMPERATURE",
            "severity": "MEDIUM",
            "description": f"Operating temperature warning: {temperature:.1f}°C (Threshold: {settings.TEMP_NORMAL_MAX}°C)",
            "action": "Verify coolant flow and clear heat dissipation paths."
        })

    # 2. Vibration alert
    if vibration > settings.VIB_HIGH_RISK_MIN:
        candidate_alerts.append({
            "alert_type": "CRITICAL_VIBRATION",
            "severity": "CRITICAL",
            "description": f"Hazardous vibration amplitude: {vibration:.2f} mm/s (Threshold: {settings.VIB_HIGH_RISK_MIN} mm/s)",
            "action": "Immediate vibration spectrum analysis to check bearing degradation or structural unbalance."
        })
    elif vibration > settings.VIB_NORMAL_MAX:
        candidate_alerts.append({
            "alert_type": "ELEVATED_VIBRATION",
            "severity": "HIGH",
            "description": f"Vibration elevated above normal: {vibration:.2f} mm/s (Threshold: {settings.VIB_NORMAL_MAX} mm/s)",
            "action": "Check shaft alignment and anchor mounting bolts."
        })

    # 3. Pressure alert
    if pressure > settings.PRESSURE_HIGH_RISK_MAX:
        candidate_alerts.append({
            "alert_type": "PRESSURE_SURGE",
            "severity": "HIGH",
            "description": f"System pressure surge: {pressure:.2f} bar (Threshold: {settings.PRESSURE_HIGH_RISK_MAX} bar)",
            "action": "Inspect pressure relief valves and test regulator response."
        })
    elif pressure < 1.0:
        candidate_alerts.append({
            "alert_type": "PRESSURE_LOSS",
            "severity": "HIGH",
            "description": f"Critical pressure loss: {pressure:.2f} bar (Minimum: 1.0 bar)",
            "action": "Inspect line seals and supply pump integrity for leakage."
        })

    # 4. Overall ML Risk alert (if risk is high and condition is HIGH RISK)
    if predicted_condition == "HIGH RISK" and failure_risk_score >= 80.0:
        candidate_alerts.append({
            "alert_type": "HIGH_FAILURE_RISK",
            "severity": "CRITICAL",
            "description": f"AI model flagged high imminent failure risk ({failure_risk_score:.1f}%)",
            "action": "Halt operation and schedule non-destructive testing and diagnostic overhaul."
        })
    elif predicted_condition == "WARNING" and failure_risk_score >= 45.0:
        candidate_alerts.append({
            "alert_type": "PREDICTIVE_WARNING",
            "severity": "MEDIUM",
            "description": f"AI model detected abnormal degradation trend (Risk score: {failure_risk_score:.1f}%)",
            "action": "Initiate preventive inspection log and monitor sensor trends closely."
        })

    created_alerts = []
    for cand in candidate_alerts:
        # Check for existing unacknowledged alert of the same type for this machine
        existing = db.query(Alert).filter(
            Alert.machine_id == machine_id,
            Alert.alert_type == cand["alert_type"],
            Alert.is_acknowledged == False
        ).first()

        if not existing:
            alert = Alert(
                machine_id=machine_id,
                machine_name=machine_name,
                alert_type=cand["alert_type"],
                severity=cand["severity"],
                description=cand["description"],
                timestamp=now,
                is_acknowledged=False,
                recommended_action=cand["action"]
            )
            db.add(alert)
            created_alerts.append(alert)

    if created_alerts:
        db.commit()
        for a in created_alerts:
            db.refresh(a)

    return created_alerts

def acknowledge_alert(db: Session, alert_id: int) -> Optional[Alert]:
    """Marks an alert as acknowledged with a timestamp."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return None

    if not alert.is_acknowledged:
        alert.is_acknowledged = True
        alert.acknowledged_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        db.refresh(alert)

    return alert
