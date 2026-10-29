import random
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import Machine, SensorReading
from app.services.prediction_service import run_prediction_pipeline

def generate_telemetry_for_machine(
    machine: Machine,
    mode: str = "normal",
    prev_reading: Optional[SensorReading] = None
) -> Dict[str, float]:
    """
    Generates synthetic sensor readings for a given machine type and simulation mode.
    All readings are explicitly simulated for engineering demonstration purposes.
    """
    # Baseline nominal values tailored by equipment type
    type_profiles = {
        "Electric Motor": {"temp": 52.0, "vib": 1.6, "rpm": 1495.0, "press": 3.2},
        "Centrifugal Pump": {"temp": 55.0, "vib": 2.1, "rpm": 2920.0, "press": 4.5},
        "Conveyor System": {"temp": 46.0, "vib": 1.3, "rpm": 820.0, "press": 2.2},
        "Screw Compressor": {"temp": 64.0, "vib": 2.4, "rpm": 1780.0, "press": 6.2},
        "5-Axis CNC Milling": {"temp": 48.0, "vib": 1.1, "rpm": 3600.0, "press": 3.4},
    }

    profile = type_profiles.get(machine.type, {"temp": 50.0, "vib": 1.8, "rpm": 1500.0, "press": 3.5})
    base_hours = prev_reading.operating_hours + random.uniform(0.1, 1.5) if prev_reading else 2500.0

    if mode == "normal":
        temp = profile["temp"] + random.gauss(0, 1.5)
        vib = profile["vib"] + random.gauss(0, 0.2)
        rpm = profile["rpm"] + random.gauss(0, 15.0)
        press = profile["press"] + random.gauss(0, 0.15)
    elif mode == "warning":
        temp = 73.0 + random.uniform(0, 8.0)
        vib = 3.6 + random.uniform(0, 1.5)
        rpm = profile["rpm"] + random.choice([-1, 1]) * random.uniform(150.0, 300.0)
        press = profile["press"] + random.choice([-1, 1]) * random.uniform(1.2, 2.0)
    elif mode == "critical":
        temp = 87.0 + random.uniform(0, 15.0)
        vib = 5.8 + random.uniform(0, 4.0)
        rpm = profile["rpm"] + random.choice([-1, 1]) * random.uniform(350.0, 600.0)
        press = random.choice([0.7, 7.8]) + random.uniform(-0.2, 0.5)
    else:  # auto / random mode
        roll = random.random()
        if roll < 0.70:
            return generate_telemetry_for_machine(machine, mode="normal", prev_reading=prev_reading)
        elif roll < 0.90:
            return generate_telemetry_for_machine(machine, mode="warning", prev_reading=prev_reading)
        else:
            return generate_telemetry_for_machine(machine, mode="critical", prev_reading=prev_reading)

    return {
        "temperature": round(max(20.0, temp), 2),
        "vibration": round(max(0.1, vib), 2),
        "rotational_speed": round(max(0.0, rpm), 1),
        "pressure": round(max(0.1, press), 2),
        "operating_hours": round(base_hours, 1)
    }

def simulate_and_record(
    db: Session,
    machine_id: Optional[str] = None,
    mode: str = "normal"
) -> List[Dict[str, Any]]:
    """
    Simulates new sensor readings, saves them in SQLite, runs prediction inference,
    and returns the updated records.
    """
    if machine_id:
        machines = db.query(Machine).filter(Machine.id == machine_id).all()
    else:
        machines = db.query(Machine).all()

    results = []
    now = datetime.datetime.now(datetime.timezone.utc)

    for m in machines:
        last_reading = db.query(SensorReading).filter(
            SensorReading.machine_id == m.id
        ).order_by(SensorReading.timestamp.desc()).first()

        telemetry = generate_telemetry_for_machine(m, mode=mode, prev_reading=last_reading)

        # 1. Save reading to SQLite
        reading = SensorReading(
            machine_id=m.id,
            timestamp=now,
            temperature=telemetry["temperature"],
            vibration=telemetry["vibration"],
            rotational_speed=telemetry["rotational_speed"],
            pressure=telemetry["pressure"],
            operating_hours=telemetry["operating_hours"],
            is_simulated=True
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)

        # 2. Run prediction pipeline and create alerts
        pred_res = run_prediction_pipeline(
            temperature=telemetry["temperature"],
            vibration=telemetry["vibration"],
            rotational_speed=telemetry["rotational_speed"],
            pressure=telemetry["pressure"],
            operating_hours=telemetry["operating_hours"],
            machine_id=m.id,
            db=db,
            store_record=True
        )

        results.append({
            "machine_id": m.id,
            "machine_name": m.name,
            "reading": {
                "id": reading.id,
                "timestamp": reading.timestamp,
                "temperature": reading.temperature,
                "vibration": reading.vibration,
                "rotational_speed": reading.rotational_speed,
                "pressure": reading.pressure,
                "operating_hours": reading.operating_hours,
                "is_simulated": reading.is_simulated
            },
            "prediction": pred_res
        })

    return results
