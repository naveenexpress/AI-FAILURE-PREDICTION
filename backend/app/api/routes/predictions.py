import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Machine, Prediction
from app.schemas.schemas import PredictionRequest, PredictionResponse
from app.services.prediction_service import run_prediction_pipeline

router = APIRouter(tags=["AI Predictions"])

@router.post("/predict", response_model=PredictionResponse)
def predict_equipment_condition(
    pred_in: PredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Executes AI failure risk prediction on sensor telemetry.
    Returns predicted condition (NORMAL, WARNING, HIGH RISK), demonstration failure-risk score,
    deterministic health score, contributing factors, and rule-based maintenance recommendations.
    """
    if pred_in.machine_id:
        machine = db.query(Machine).filter(Machine.id == pred_in.machine_id).first()
        if not machine:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Machine '{pred_in.machine_id}' does not exist."
            )

    try:
        result = run_prediction_pipeline(
            temperature=pred_in.temperature,
            vibration=pred_in.vibration,
            rotational_speed=pred_in.rotational_speed,
            pressure=pred_in.pressure,
            operating_hours=pred_in.operating_hours,
            machine_id=pred_in.machine_id,
            db=db,
            store_record=True if pred_in.machine_id else False
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error occurred: {str(e)}"
        )

@router.get("/predictions", response_model=List[PredictionResponse])
def list_predictions(
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieve global prediction history across all machines."""
    preds = db.query(Prediction).order_by(Prediction.timestamp.desc()).limit(limit).all()
    results = []
    for p in preds:
        results.append({
            "id": p.id,
            "machine_id": p.machine_id,
            "timestamp": p.timestamp,
            "predicted_condition": p.predicted_condition,
            "failure_risk_score": p.failure_risk_score,
            "health_score": p.health_score,
            "probabilities": None,
            "contributing_factors": json.loads(p.contributing_factors) if p.contributing_factors else [],
            "recommendations": json.loads(p.recommendations) if p.recommendations else [],
            "model_version": p.model_version
        })
    return results

@router.get("/machines/{machine_id}/predictions", response_model=List[PredictionResponse])
def get_machine_predictions(
    machine_id: str,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieve prediction history for a specific machine."""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine '{machine_id}' does not exist."
        )

    preds = db.query(Prediction).filter(
        Prediction.machine_id == machine_id
    ).order_by(Prediction.timestamp.desc()).limit(limit).all()

    results = []
    for p in preds:
        results.append({
            "id": p.id,
            "machine_id": p.machine_id,
            "timestamp": p.timestamp,
            "predicted_condition": p.predicted_condition,
            "failure_risk_score": p.failure_risk_score,
            "health_score": p.health_score,
            "probabilities": None,
            "contributing_factors": json.loads(p.contributing_factors) if p.contributing_factors else [],
            "recommendations": json.loads(p.recommendations) if p.recommendations else [],
            "model_version": p.model_version
        })
    return results
