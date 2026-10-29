import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
import joblib
import pandas as pd
from app.ml.train_model import (
    MODEL_FILE,
    METADATA_FILE,
    train_and_save_model
)
from app.ml.synthetic_data import FEATURES, CLASS_NAMES

logger = logging.getLogger(__name__)

_MODEL_CACHE = None
_METADATA_CACHE = None

def get_model():
    """Returns the loaded Scikit-Learn model, training it if not already present."""
    global _MODEL_CACHE, _METADATA_CACHE
    if _MODEL_CACHE is not None:
        return _MODEL_CACHE

    if not MODEL_FILE.exists() or not METADATA_FILE.exists():
        logger.info("ML model artifact not found on disk. Initiating initial training...")
        train_and_save_model()

    try:
        _MODEL_CACHE = joblib.load(MODEL_FILE)
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            _METADATA_CACHE = json.load(f)
        return _MODEL_CACHE
    except Exception as e:
        logger.error(f"Error loading model artifact: {e}. Retraining...")
        train_and_save_model()
        _MODEL_CACHE = joblib.load(MODEL_FILE)
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            _METADATA_CACHE = json.load(f)
        return _MODEL_CACHE

def get_model_metadata() -> Dict[str, Any]:
    """Returns metadata and evaluation metrics for the active model."""
    global _METADATA_CACHE
    if _METADATA_CACHE is not None:
        return _METADATA_CACHE

    if not METADATA_FILE.exists():
        get_model()

    if METADATA_FILE.exists():
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            _METADATA_CACHE = json.load(f)
        return _METADATA_CACHE

    return {}

def retrain_model(n_samples: int = 3000, random_seed: int = 42) -> Dict[str, Any]:
    """Explicitly triggers retraining, updates artifacts and invalidates in-memory cache."""
    global _MODEL_CACHE, _METADATA_CACHE
    metadata = train_and_save_model(n_samples=n_samples, random_seed=random_seed)
    _MODEL_CACHE = joblib.load(MODEL_FILE)
    _METADATA_CACHE = metadata
    return metadata

def predict_single(
    temperature: float,
    vibration: float,
    rotational_speed: float,
    pressure: float,
    operating_hours: float
) -> Tuple[str, float, Dict[str, float]]:
    """
    Runs model inference on the provided sensor reading features.
    
    Returns:
        (predicted_condition_str, demonstration_failure_risk_score, probabilities_dict)
    """
    model = get_model()
    input_df = pd.DataFrame([{
        "temperature": float(temperature),
        "vibration": float(vibration),
        "rotational_speed": float(rotational_speed),
        "pressure": float(pressure),
        "operating_hours": float(operating_hours)
    }])[FEATURES]

    # Predict class and class probabilities
    pred_idx = int(model.predict(input_df)[0])
    probs = model.predict_proba(input_df)[0]

    prob_map = {
        CLASS_NAMES[i]: round(float(probs[i]), 4)
        for i in range(len(CLASS_NAMES))
    }

    predicted_condition = CLASS_NAMES[pred_idx]

    # Calculate demonstration risk score (0 to 100%)
    # Normal prob contributes 0%, Warning contributes up to 40%, High Risk contributes 100%
    p_warn = prob_map.get("WARNING", 0.0)
    p_risk = prob_map.get("HIGH RISK", 0.0)
    risk_score = min(100.0, max(0.0, (p_warn * 40.0) + (p_risk * 100.0)))

    return predicted_condition, round(risk_score, 1), prob_map
