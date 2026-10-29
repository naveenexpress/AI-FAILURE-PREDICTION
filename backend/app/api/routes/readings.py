import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Machine, SensorReading
from app.schemas.schemas import SensorReadingCreate, SensorReadingResponse
from app.services.prediction_service import run_prediction_pipeline

router = APIRouter(tags=["Sensor Readings"])

@router.get("/machines/{machine_id}/readings", response_model=List[SensorReadingResponse])
def get_machine_readings(
    machine_id: str,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieve historical sensor readings for a specific machine."""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine '{machine_id}' not found."
        )

    readings = db.query(SensorReading).filter(
        SensorReading.machine_id == machine_id
    ).order_by(SensorReading.timestamp.desc()).limit(limit).all()

    return readings

@router.post("/readings", response_model=SensorReadingResponse, status_code=status.HTTP_201_CREATED)
def submit_sensor_reading(
    reading_in: SensorReadingCreate,
    db: Session = Depends(get_db)
):
    """
    Submits a new sensor reading.
    Validates machine existence, writes reading to SQLite, and automatically executes AI risk prediction.
    """
    machine = db.query(Machine).filter(Machine.id == reading_in.machine_id).first()
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine '{reading_in.machine_id}' does not exist."
        )

    # Input validations
    if reading_in.temperature < -50 or reading_in.temperature > 250:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Temperature out of realistic bounds (-50°C to 250°C).")
    if reading_in.vibration < 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Vibration cannot be negative.")
    if reading_in.rotational_speed < 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Rotational speed cannot be negative.")
    if reading_in.pressure < 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Pressure cannot be negative.")

    now = reading_in.timestamp or datetime.datetime.now(datetime.timezone.utc)

    reading = SensorReading(
        machine_id=reading_in.machine_id,
        timestamp=now,
        temperature=reading_in.temperature,
        vibration=reading_in.vibration,
        rotational_speed=reading_in.rotational_speed,
        pressure=reading_in.pressure,
        operating_hours=reading_in.operating_hours,
        is_simulated=reading_in.is_simulated
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    # Trigger AI prediction and alerts in background/synchronously
    run_prediction_pipeline(
        temperature=reading.temperature,
        vibration=reading.vibration,
        rotational_speed=reading.rotational_speed,
        pressure=reading.pressure,
        operating_hours=reading.operating_hours,
        machine_id=machine.id,
        db=db,
        store_record=True
    )

    return reading

@router.get("/readings/latest", response_model=List[SensorReadingResponse])
def get_latest_readings(db: Session = Depends(get_db)):
    """Fetches the single latest telemetry reading for each registered machine."""
    machines = db.query(Machine).all()
    latest_readings = []

    for m in machines:
        last = db.query(SensorReading).filter(
            SensorReading.machine_id == m.id
        ).order_by(SensorReading.timestamp.desc()).first()
        if last:
            latest_readings.append(last)

    return latest_readings
