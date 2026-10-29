import json
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import Prediction, Machine
from app.ml.model_loader import predict_single
from app.services.health_score_service import calculate_health_score
from app.services.maintenance_service import get_recommendations_for_readings
from app.services.alert_service import evaluate_and_create_alerts

def run_prediction_pipeline(
    temperature: float,
    vibration: float,
    rotational_speed: float,
    pressure: float,
    operating_hours: float,
    machine_id: Optional[str] = None,
    db: Optional[Session] = None,
    store_record: bool = True
) -> Dict[str, Any]:
    """
    Executes the complete AI prediction, health evaluation, rule-based recommendation,
    and alert pipeline.
    """
    # 1. Model inference
    predicted_condition, risk_score, prob_map = predict_single(
        temperature=temperature,
        vibration=vibration,
        rotational_speed=rotational_speed,
        pressure=pressure,
        operating_hours=operating_hours
    )

    # 2. Deterministic Health Score & contributing factors
    health_score, health_factors = calculate_health_score(
        temperature=temperature,
        vibration=vibration,
        rotational_speed=rotational_speed,
        pressure=pressure,
        operating_hours=operating_hours
    )

    # 3. Preventive Maintenance Recommendations
    rec_items = get_recommendations_for_readings(
        temperature=temperature,
        vibration=vibration,
        rotational_speed=rotational_speed,
        pressure=pressure,
        operating_hours=operating_hours,
        predicted_condition=predicted_condition
    )
    rec_texts = [f"[{r['priority']}] {r['title']}: {r['action_required']}" for r in rec_items]

    now = datetime.datetime.now(datetime.timezone.utc)
    pred_record_id = None

    # 4. If machine_id and db session are provided, persist and update machine status
    if db is not None and machine_id:
        machine = db.query(Machine).filter(Machine.id == machine_id).first()
        machine_name = machine.name if machine else machine_id

        # Update machine condition status
        if machine:
            machine.status = predicted_condition
            machine.updated_at = now

        if store_record:
            pred_obj = Prediction(
                machine_id=machine_id,
                timestamp=now,
                predicted_condition=predicted_condition,
                failure_risk_score=risk_score,
                health_score=health_score,
                contributing_factors=json.dumps(health_factors),
                recommendations=json.dumps(rec_texts),
                model_version="rf-v1.0"
            )
            db.add(pred_obj)
            db.commit()
            db.refresh(pred_obj)
            pred_record_id = pred_obj.id

        # Check and trigger alerts
        evaluate_and_create_alerts(
            db=db,
            machine_id=machine_id,
            machine_name=machine_name,
            temperature=temperature,
            vibration=vibration,
            rotational_speed=rotational_speed,
            pressure=pressure,
            predicted_condition=predicted_condition,
            failure_risk_score=risk_score
        )

    return {
        "id": pred_record_id,
        "machine_id": machine_id,
        "timestamp": now,
        "predicted_condition": predicted_condition,
        "failure_risk_score": risk_score,
        "health_score": health_score,
        "probabilities": prob_map,
        "contributing_factors": health_factors,
        "recommendations": rec_texts,
        "model_version": "rf-v1.0"
    }
