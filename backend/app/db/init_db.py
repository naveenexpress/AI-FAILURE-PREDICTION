import json
import datetime
from sqlalchemy.orm import Session
from app.db.database import engine, Base, SessionLocal
from app.db.models import Machine, SensorReading, Prediction, Alert, MaintenanceRecommendation

SAMPLE_MACHINES = [
    {
        "id": "MCH-001",
        "name": "Industrial Motor",
        "type": "Electric Motor",
        "location": "Bay 1 - Main Drive Line",
        "installation_date": "2024-01-15",
        "status": "NORMAL",
        "description": "Primary 45kW 3-phase induction motor driving the production conveyor."
    },
    {
        "id": "MCH-002",
        "name": "Centrifugal Pump",
        "type": "Centrifugal Pump",
        "location": "Bay 2 - Cooling Water Circuit",
        "installation_date": "2023-11-20",
        "status": "WARNING",
        "description": "High-capacity water circulation pump for plant cooling towers."
    },
    {
        "id": "MCH-003",
        "name": "Conveyor Belt",
        "type": "Conveyor System",
        "location": "Assembly Line 4",
        "installation_date": "2024-03-05",
        "status": "NORMAL",
        "description": "Heavy-duty continuous modular roller conveyor transporting components."
    },
    {
        "id": "MCH-004",
        "name": "Industrial Compressor",
        "type": "Screw Compressor",
        "location": "Utility Building Room 102",
        "installation_date": "2023-08-12",
        "status": "HIGH RISK",
        "description": "Rotary twin-screw air compressor supplying 8-bar plant pneumatic lines."
    },
    {
        "id": "MCH-005",
        "name": "CNC Machine",
        "type": "5-Axis CNC Milling",
        "location": "Precision Machine Shop",
        "installation_date": "2024-05-10",
        "status": "NORMAL",
        "description": "High-precision computer numerical control milling center with direct-drive spindle."
    }
]

def init_db(db: Session = None):
    """Creates database tables and seeds initial sample machines if not already present."""
    Base.metadata.create_all(bind=engine)

    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        now = datetime.datetime.now(datetime.timezone.utc)

        for m_data in SAMPLE_MACHINES:
            existing = db.query(Machine).filter(Machine.id == m_data["id"]).first()
            if not existing:
                machine = Machine(
                    id=m_data["id"],
                    name=m_data["name"],
                    type=m_data["type"],
                    location=m_data["location"],
                    installation_date=m_data["installation_date"],
                    status=m_data["status"],
                    description=m_data["description"],
                    created_at=now,
                    updated_at=now
                )
                db.add(machine)
                db.flush()

                # Seed initial baseline readings over the last 6 hours
                base_configs = {
                    "MCH-001": {"temp": 54.0, "vib": 1.6, "rpm": 1495.0, "press": 3.2, "hours": 2400.0, "cond": "NORMAL", "risk": 8.5, "health": 94.0},
                    "MCH-002": {"temp": 74.5, "vib": 3.8, "rpm": 2880.0, "press": 4.8, "hours": 6200.0, "cond": "WARNING", "risk": 48.0, "health": 68.0},
                    "MCH-003": {"temp": 46.0, "vib": 1.2, "rpm": 805.0, "press": 2.4, "hours": 1850.0, "cond": "NORMAL", "risk": 5.0, "health": 97.0},
                    "MCH-004": {"temp": 88.5, "vib": 6.2, "rpm": 1720.0, "press": 7.4, "hours": 8900.0, "cond": "HIGH RISK", "risk": 91.5, "health": 28.0},
                    "MCH-005": {"temp": 50.0, "vib": 1.4, "rpm": 3590.0, "press": 3.5, "hours": 1100.0, "cond": "NORMAL", "risk": 7.0, "health": 96.0},
                }

                cfg = base_configs.get(m_data["id"], {"temp": 50.0, "vib": 1.5, "rpm": 1500.0, "press": 3.0, "hours": 1000.0, "cond": "NORMAL", "risk": 10.0, "health": 90.0})

                for i in range(6, -1, -1):
                    reading_time = now - datetime.timedelta(hours=i)
                    temp_val = cfg["temp"] + (0.5 * (6 - i))
                    vib_val = cfg["vib"] + (0.05 * (6 - i))
                    rpm_val = cfg["rpm"] + ((i % 3 - 1) * 5)
                    press_val = cfg["press"] + ((i % 2 - 0.5) * 0.1)
                    hours_val = cfg["hours"] + (6 - i)

                    reading = SensorReading(
                        machine_id=m_data["id"],
                        timestamp=reading_time,
                        temperature=round(temp_val, 2),
                        vibration=round(vib_val, 2),
                        rotational_speed=round(rpm_val, 1),
                        pressure=round(press_val, 2),
                        operating_hours=round(hours_val, 1),
                        is_simulated=True
                    )
                    db.add(reading)

                # Seed initial prediction
                factors = []
                recs = []
                if cfg["cond"] == "WARNING":
                    factors = ["Temperature elevated above 70°C threshold (74.5°C)", "Vibration elevated (3.8 mm/s)"]
                    recs = ["Check coolant flow and filter condition", "Perform vibration spectrum analysis to check balance"]
                elif cfg["cond"] == "HIGH RISK":
                    factors = ["Critical temperature breach > 85°C (88.5°C)", "Critical bearing vibration > 5.5 mm/s (6.2 mm/s)", "Pressure elevated > 7.0 bar"]
                    recs = ["Immediate equipment shutdown recommended", "Inspect bearings, rotor dynamic balancing, and pressure relief valve"]

                pred = Prediction(
                    machine_id=m_data["id"],
                    timestamp=now,
                    predicted_condition=cfg["cond"],
                    failure_risk_score=cfg["risk"],
                    health_score=cfg["health"],
                    contributing_factors=json.dumps(factors),
                    recommendations=json.dumps(recs),
                    model_version="rf-v1.0"
                )
                db.add(pred)

                # Seed sample alerts if warning/high risk
                if cfg["cond"] == "WARNING":
                    alert = Alert(
                        machine_id=m_data["id"],
                        machine_name=m_data["name"],
                        alert_type="ELEVATED_VIBRATION",
                        severity="MEDIUM",
                        description=f"{m_data['name']} vibration exceeded warning threshold at {cfg['vib']} mm/s.",
                        timestamp=now - datetime.timedelta(minutes=30),
                        is_acknowledged=False,
                        recommended_action="Inspect bearing assembly and verify dynamic shaft alignment."
                    )
                    db.add(alert)
                elif cfg["cond"] == "HIGH RISK":
                    alert = Alert(
                        machine_id=m_data["id"],
                        machine_name=m_data["name"],
                        alert_type="CRITICAL_OVERHEATING_AND_VIBRATION",
                        severity="CRITICAL",
                        description=f"{m_data['name']} triggered critical alarm: Temperature {cfg['temp']}°C, Vibration {cfg['vib']} mm/s.",
                        timestamp=now - datetime.timedelta(minutes=15),
                        is_acknowledged=False,
                        recommended_action="Immediately halt compressor, verify oil pressure and inspect for mechanical seizure."
                    )
                    db.add(alert)

                # Seed initial maintenance recommendation
                if recs:
                    for idx, r in enumerate(recs):
                        db_rec = MaintenanceRecommendation(
                            machine_id=m_data["id"],
                            title=f"Preventive Inspection for {m_data['name']}",
                            category="MECHANICAL" if "vibration" in r.lower() else "THERMAL",
                            priority="HIGH" if cfg["cond"] == "HIGH RISK" else "MEDIUM",
                            action_required=r,
                            rationale=f"Automated risk rule triggered due to {cfg['cond']} condition.",
                            created_at=now
                        )
                        db.add(db_rec)

        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        if close_session:
            db.close()
