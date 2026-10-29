from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Machine
from app.services.simulator_service import simulate_and_record

router = APIRouter(prefix="/simulator", tags=["Sensor Simulator"])

class SimulateRequest(BaseModel):
    machine_id: Optional[str] = Field(None, description="Optional machine ID to simulate. If omitted, simulates for all machines.")
    mode: str = Field("normal", description="Simulation scenario: 'normal', 'warning', 'critical', or 'random'")

@router.post("/generate")
def trigger_sensor_simulation(
    payload: Optional[SimulateRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Generates synthetic sensor readings for registered equipment.
    All generated readings are stored in SQLite and immediately evaluated by the AI prediction pipeline.
    """
    mode = payload.mode.lower() if payload and payload.mode else "normal"
    m_id = payload.machine_id if payload and payload.machine_id else None

    if mode not in ["normal", "warning", "critical", "random"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mode must be 'normal', 'warning', 'critical', or 'random'."
        )

    if m_id:
        machine = db.query(Machine).filter(Machine.id == m_id).first()
        if not machine:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Machine '{m_id}' not found."
            )

    results = simulate_and_record(db=db, machine_id=m_id, mode=mode)

    return {
        "success": True,
        "mode": mode,
        "simulated_count": len(results),
        "results": results
    }
