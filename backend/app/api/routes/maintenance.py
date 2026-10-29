from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import MaintenanceRecommendation, Machine, SensorReading
from app.schemas.schemas import MaintenanceRecommendationResponse
from app.services.maintenance_service import get_recommendations_for_readings

router = APIRouter(prefix="/maintenance", tags=["Maintenance Recommendations"])

@router.get("/recommendations", response_model=List[MaintenanceRecommendationResponse])
def get_maintenance_recommendations(
    machine_id: Optional[str] = Query(None, description="Filter recommendations by machine ID"),
    category: Optional[str] = Query(None, description="Filter by category: MECHANICAL, THERMAL, LUBRICATION, ELECTRICAL, INSPECTION"),
    db: Session = Depends(get_db)
):
    """
    Retrieve rule-based preventive maintenance recommendations for monitored equipment.
    Combines recorded recommendations with live evaluation of latest telemetry.
    """
    query = db.query(MaintenanceRecommendation)

    if machine_id:
        query = query.filter(MaintenanceRecommendation.machine_id == machine_id)
    if category and category.upper() != "ALL":
        query = query.filter(MaintenanceRecommendation.category == category.upper())

    stored_recs = query.order_by(MaintenanceRecommendation.created_at.desc()).limit(100).all()
    return stored_recs
