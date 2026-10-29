import csv
import io
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Machine, SensorReading, Prediction, Alert, MaintenanceRecommendation

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])

def parse_iso_date(dt_str: Optional[str]) -> Optional[datetime.datetime]:
    if not dt_str:
        return None
    try:
        # Support YYYY-MM-DD or full ISO
        if len(dt_str) == 10:
            return datetime.datetime.fromisoformat(f"{dt_str}T00:00:00+00:00")
        return datetime.datetime.fromisoformat(dt_str)
    except Exception:
        return None

@router.get("/summary")
def get_reports_summary(
    machine_id: Optional[str] = Query(None, description="Optional machine filter"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Returns aggregated report statistics filtered by equipment and date window."""
    s_dt = parse_iso_date(start_date)
    e_dt = parse_iso_date(end_date)
    if e_dt and len(end_date) == 10:
        e_dt = e_dt + datetime.timedelta(days=1)

    r_query = db.query(SensorReading)
    p_query = db.query(Prediction)
    a_query = db.query(Alert)

    if machine_id and machine_id.upper() != "ALL":
        r_query = r_query.filter(SensorReading.machine_id == machine_id)
        p_query = p_query.filter(Prediction.machine_id == machine_id)
        a_query = a_query.filter(Alert.machine_id == machine_id)

    if s_dt:
        r_query = r_query.filter(SensorReading.timestamp >= s_dt)
        p_query = p_query.filter(Prediction.timestamp >= s_dt)
        a_query = a_query.filter(Alert.timestamp >= s_dt)

    if e_dt:
        r_query = r_query.filter(SensorReading.timestamp <= e_dt)
        p_query = p_query.filter(Prediction.timestamp <= e_dt)
        a_query = a_query.filter(Alert.timestamp <= e_dt)

    total_readings = r_query.count()
    total_predictions = p_query.count()
    total_alerts = a_query.count()
    unack_alerts = a_query.filter(Alert.is_acknowledged == False).count()

    recent_preds = p_query.order_by(Prediction.timestamp.desc()).limit(20).all()
    avg_risk = 0.0
    avg_health = 100.0
    if recent_preds:
        avg_risk = sum(p.failure_risk_score for p in recent_preds) / len(recent_preds)
        avg_health = sum(p.health_score for p in recent_preds) / len(recent_preds)

    return {
        "machine_id": machine_id or "ALL",
        "filter_start": start_date,
        "filter_end": end_date,
        "total_sensor_readings": total_readings,
        "total_predictions": total_predictions,
        "total_alerts": total_alerts,
        "unacknowledged_alerts": unack_alerts,
        "average_failure_risk_score": round(avg_risk, 1),
        "average_health_score": round(avg_health, 1)
    }

@router.get("/readings.csv")
def export_readings_csv(
    machine_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Exports safe CSV formatted telemetry sensor readings with optional filters."""
    query = db.query(SensorReading)

    if machine_id and machine_id.upper() != "ALL":
        query = query.filter(SensorReading.machine_id == machine_id)

    s_dt = parse_iso_date(start_date)
    e_dt = parse_iso_date(end_date)
    if s_dt:
        query = query.filter(SensorReading.timestamp >= s_dt)
    if e_dt:
        if len(end_date) == 10:
            e_dt = e_dt + datetime.timedelta(days=1)
        query = query.filter(SensorReading.timestamp <= e_dt)

    readings = query.order_by(SensorReading.timestamp.desc()).limit(5000).all()

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Header
    writer.writerow([
        "Reading_ID",
        "Machine_ID",
        "Timestamp_UTC",
        "Temperature_C",
        "Vibration_mm_s",
        "Rotational_Speed_RPM",
        "Pressure_bar",
        "Operating_Hours",
        "Is_Simulated"
    ])

    for r in readings:
        writer.writerow([
            r.id,
            r.machine_id,
            r.timestamp.isoformat() if r.timestamp else "",
            r.temperature,
            r.vibration,
            r.rotational_speed,
            r.pressure,
            r.operating_hours,
            r.is_simulated
        ])

    csv_content = output.getvalue()
    output.close()

    filename = f"sensor_readings_{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/alerts.csv")
def export_alerts_csv(
    machine_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Exports safe CSV formatted equipment alert history with optional filters."""
    query = db.query(Alert)

    if machine_id and machine_id.upper() != "ALL":
        query = query.filter(Alert.machine_id == machine_id)

    s_dt = parse_iso_date(start_date)
    e_dt = parse_iso_date(end_date)
    if s_dt:
        query = query.filter(Alert.timestamp >= s_dt)
    if e_dt:
        if len(end_date) == 10:
            e_dt = e_dt + datetime.timedelta(days=1)
        query = query.filter(Alert.timestamp <= e_dt)

    alerts = query.order_by(Alert.timestamp.desc()).limit(5000).all()

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Header
    writer.writerow([
        "Alert_ID",
        "Machine_ID",
        "Machine_Name",
        "Alert_Type",
        "Severity",
        "Description",
        "Timestamp_UTC",
        "Is_Acknowledged",
        "Acknowledged_At_UTC",
        "Recommended_Action"
    ])

    for a in alerts:
        writer.writerow([
            a.id,
            a.machine_id,
            a.machine_name,
            a.alert_type,
            a.severity,
            a.description,
            a.timestamp.isoformat() if a.timestamp else "",
            a.is_acknowledged,
            a.acknowledged_at.isoformat() if a.acknowledged_at else "",
            a.recommended_action
        ])

    csv_content = output.getvalue()
    output.close()

    filename = f"equipment_alerts_{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
