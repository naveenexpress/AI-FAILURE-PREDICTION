import json
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.database import get_db
from app.db.models import Machine, SensorReading, Prediction, Alert, MaintenanceRecommendation
from app.schemas.schemas import MachineCreate, MachineUpdate, MachineResponse

router = APIRouter(prefix="/machines", tags=["Machines"])

@router.get("", response_model=List[MachineResponse])
def list_machines(
    q: Optional[str] = Query(None, description="Search query for name, id, or type"),
    status: Optional[str] = Query(None, description="Filter by status: NORMAL, WARNING, HIGH RISK, OFFLINE"),
    db: Session = Depends(get_db)
):
    """Retrieve all registered equipment with optional search and status filtering."""
    query = db.query(Machine)

    if q:
        search = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Machine.id.ilike(search),
                Machine.name.ilike(search),
                Machine.type.ilike(search),
                Machine.location.ilike(search)
            )
        )

    if status and status.upper() != "ALL":
        query = query.filter(Machine.status == status.upper())

    machines = query.order_by(Machine.id.asc()).all()

    # Enrich with latest reading and latest prediction
    res = []
    for m in machines:
        latest_r = db.query(SensorReading).filter(
            SensorReading.machine_id == m.id
        ).order_by(SensorReading.timestamp.desc()).first()

        latest_p = db.query(Prediction).filter(
            Prediction.machine_id == m.id
        ).order_by(Prediction.timestamp.desc()).first()

        reading_dict = None
        if latest_r:
            reading_dict = {
                "id": latest_r.id,
                "timestamp": latest_r.timestamp.isoformat(),
                "temperature": latest_r.temperature,
                "vibration": latest_r.vibration,
                "rotational_speed": latest_r.rotational_speed,
                "pressure": latest_r.pressure,
                "operating_hours": latest_r.operating_hours
            }

        pred_dict = None
        if latest_p:
            factors = []
            try:
                factors = json.loads(latest_p.contributing_factors) if latest_p.contributing_factors else []
            except Exception:
                pass
            pred_dict = {
                "id": latest_p.id,
                "timestamp": latest_p.timestamp.isoformat(),
                "predicted_condition": latest_p.predicted_condition,
                "failure_risk_score": latest_p.failure_risk_score,
                "health_score": latest_p.health_score,
                "contributing_factors": factors
            }

        m_dict = {
            "id": m.id,
            "name": m.name,
            "type": m.type,
            "location": m.location,
            "installation_date": m.installation_date,
            "status": m.status,
            "description": m.description,
            "created_at": m.created_at,
            "updated_at": m.updated_at,
            "latest_reading": reading_dict,
            "latest_prediction": pred_dict
        }
        res.append(m_dict)

    return res

@router.get("/{machine_id}")
def get_machine_details(machine_id: str, db: Session = Depends(get_db)):
    """Fetch single machine details along with recent readings, predictions, active alerts, and recommendations."""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine with ID '{machine_id}' was not found."
        )

    # Latest 30 readings
    readings = db.query(SensorReading).filter(
        SensorReading.machine_id == machine_id
    ).order_by(SensorReading.timestamp.desc()).limit(30).all()

    # Latest 10 predictions
    predictions = db.query(Prediction).filter(
        Prediction.machine_id == machine_id
    ).order_by(Prediction.timestamp.desc()).limit(10).all()

    # Active alerts
    active_alerts = db.query(Alert).filter(
        Alert.machine_id == machine_id,
        Alert.is_acknowledged == False
    ).order_by(Alert.timestamp.desc()).all()

    # Recommendations
    recs = db.query(MaintenanceRecommendation).filter(
        MaintenanceRecommendation.machine_id == machine_id
    ).order_by(MaintenanceRecommendation.created_at.desc()).limit(10).all()

    return {
        "machine": {
            "id": machine.id,
            "name": machine.name,
            "type": machine.type,
            "location": machine.location,
            "installation_date": machine.installation_date,
            "status": machine.status,
            "description": machine.description,
            "created_at": machine.created_at,
            "updated_at": machine.updated_at
        },
        "readings": [
            {
                "id": r.id,
                "timestamp": r.timestamp,
                "temperature": r.temperature,
                "vibration": r.vibration,
                "rotational_speed": r.rotational_speed,
                "pressure": r.pressure,
                "operating_hours": r.operating_hours,
                "is_simulated": r.is_simulated
            } for r in reversed(readings)
        ],
        "predictions": [
            {
                "id": p.id,
                "timestamp": p.timestamp,
                "predicted_condition": p.predicted_condition,
                "failure_risk_score": p.failure_risk_score,
                "health_score": p.health_score,
                "contributing_factors": json.loads(p.contributing_factors) if p.contributing_factors else [],
                "recommendations": json.loads(p.recommendations) if p.recommendations else []
            } for p in predictions
        ],
        "active_alerts": [
            {
                "id": a.id,
                "alert_type": a.alert_type,
                "severity": a.severity,
                "description": a.description,
                "timestamp": a.timestamp,
                "is_acknowledged": a.is_acknowledged,
                "recommended_action": a.recommended_action
            } for a in active_alerts
        ],
        "recommendations": [
            {
                "id": rec.id,
                "title": rec.title,
                "category": rec.category,
                "priority": rec.priority,
                "action_required": rec.action_required,
                "rationale": rec.rationale,
                "created_at": rec.created_at
            } for rec in recs
        ]
    }

@router.post("", response_model=MachineResponse, status_code=status.HTTP_201_CREATED)
def create_machine(data: MachineCreate, db: Session = Depends(get_db)):
    """Create a new machine. Ensures ID uniqueness and validates fields."""
    m_id = data.id.strip().upper() if data.id and data.id.strip() else f"MCH-{uuid.uuid4().hex[:6].upper()}"

    existing = db.query(Machine).filter(Machine.id == m_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Machine with ID '{m_id}' already exists."
        )

    now = datetime.datetime.now(datetime.timezone.utc)
    machine = Machine(
        id=m_id,
        name=data.name.strip(),
        type=data.type.strip(),
        location=data.location.strip() if data.location else None,
        installation_date=data.installation_date,
        status=data.status if data.status else "NORMAL",
        description=data.description,
        created_at=now,
        updated_at=now
    )
    db.add(machine)
    db.commit()
    db.refresh(machine)

    return {
        "id": machine.id,
        "name": machine.name,
        "type": machine.type,
        "location": machine.location,
        "installation_date": machine.installation_date,
        "status": machine.status,
        "description": machine.description,
        "created_at": machine.created_at,
        "updated_at": machine.updated_at,
        "latest_reading": None,
        "latest_prediction": None
    }

@router.put("/{machine_id}", response_model=MachineResponse)
def update_machine(machine_id: str, data: MachineUpdate, db: Session = Depends(get_db)):
    """Update details for an existing machine."""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine with ID '{machine_id}' was not found."
        )

    if data.name is not None:
        machine.name = data.name.strip()
    if data.type is not None:
        machine.type = data.type.strip()
    if data.location is not None:
        machine.location = data.location.strip()
    if data.installation_date is not None:
        machine.installation_date = data.installation_date
    if data.status is not None:
        machine.status = data.status
    if data.description is not None:
        machine.description = data.description

    machine.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(machine)

    return {
        "id": machine.id,
        "name": machine.name,
        "type": machine.type,
        "location": machine.location,
        "installation_date": machine.installation_date,
        "status": machine.status,
        "description": machine.description,
        "created_at": machine.created_at,
        "updated_at": machine.updated_at,
        "latest_reading": None,
        "latest_prediction": None
    }

@router.delete("/{machine_id}")
def delete_machine(
    machine_id: str,
    force: bool = Query(False, description="If true, cascades deletion of all readings, predictions, and alerts"),
    db: Session = Depends(get_db)
):
    """
    Deletes a machine.
    Explicit policy: If historical readings or alerts exist, deletion requires '?force=true' to prevent accidental data loss.
    """
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine with ID '{machine_id}' was not found."
        )

    readings_count = db.query(SensorReading).filter(SensorReading.machine_id == machine_id).count()
    alerts_count = db.query(Alert).filter(Alert.machine_id == machine_id).count()

    if (readings_count > 0 or alerts_count > 0) and not force:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Machine '{machine.name}' ({machine_id}) has {readings_count} historical readings and {alerts_count} alerts. Specify ?force=true to confirm permanent cascade deletion."
        )

    db.delete(machine)
    db.commit()

    return {
        "success": True,
        "message": f"Machine '{machine_id}' and all associated records deleted successfully."
    }
