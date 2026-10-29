from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel
from app.ml.model_loader import get_model_metadata, retrain_model

router = APIRouter(prefix="/model", tags=["Machine Learning Model"])

class TrainModelRequest(BaseModel):
    n_samples: Optional[int] = 3000
    random_seed: Optional[int] = 42

@router.get("/info")
def get_model_information():
    """Returns technical metadata, classification metrics, feature importances, and model limitations."""
    meta = get_model_metadata()
    if not meta:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model metadata could not be loaded."
        )
    return meta

@router.post("/train")
def trigger_model_training(payload: Optional[TrainModelRequest] = None):
    """
    Explicitly trains the Scikit-Learn Random Forest Classifier on a new synthetic dataset.
    Updates model artifacts and returns refreshed evaluation metrics.
    """
    n_samples = payload.n_samples if payload and payload.n_samples else 3000
    seed = payload.random_seed if payload and payload.random_seed is not None else 42

    if n_samples < 500 or n_samples > 20000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="n_samples must be between 500 and 20,000."
        )

    try:
        updated_meta = retrain_model(n_samples=n_samples, random_seed=seed)
        return {
            "success": True,
            "message": "Random Forest model successfully trained and persisted.",
            "metrics": updated_meta["metrics"],
            "trained_at": updated_meta["trained_at"],
            "version": updated_meta["version"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retraining failed: {str(e)}"
        )
