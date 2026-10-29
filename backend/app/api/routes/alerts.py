from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Alert
from app.schemas.schemas import AlertResponse, AlertAcknowledgeResponse
from app.services.alert_service import acknowledge_alert

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    machine_id: Optional[str] = Query(None, description="Filter by machine ID"),
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    acknowledged: Optional[bool] = Query(None, description="Filter by acknowledgment state"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieve system alerts with optional filtering by machine, severity, and acknowledgment state."""
    query = db.query(Alert)

    if machine_id:
        query = query.filter(Alert.machine_id == machine_id)
    if severity and severity.upper() != "ALL":
        query = query.filter(Alert.severity == severity.upper())
    if acknowledged is not None:
        query = query.filter(Alert.is_acknowledged == acknowledged)

    alerts = query.order_by(Alert.timestamp.desc()).limit(limit).all()
    return alerts

@router.patch("/{alert_id}/acknowledge", response_model=AlertAcknowledgeResponse)
def acknowledge_single_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    """Acknowledge an active alert by ID."""
    alert = acknowledge_alert(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} was not found."
        )

    return {
        "success": True,
        "message": f"Alert {alert_id} acknowledged successfully.",
        "alert": alert
    }
