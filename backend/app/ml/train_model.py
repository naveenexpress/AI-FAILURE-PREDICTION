import os
import json
import datetime
from pathlib import Path
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)
from app.ml.synthetic_data import (
    generate_synthetic_dataset,
    FEATURES,
    CLASS_NAMES
)

MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_FILE = MODEL_DIR / "equipment_rf_model.joblib"
METADATA_FILE = MODEL_DIR / "model_metadata.json"

def train_and_save_model(n_samples: int = 3000, random_seed: int = 42) -> dict:
    """
    Trains a Scikit-Learn Random Forest Classifier on synthetic equipment sensor data
    and persists the model artifact and evaluation metadata to disk.
    """
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Generate data
    df = generate_synthetic_dataset(n_samples=n_samples, random_seed=random_seed)
    X = df[FEATURES]
    y = df["condition"]

    # 2. Train/Test Split (80/20 Stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.20,
        random_state=random_seed,
        stratify=y
    )

    # 3. Model Training
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=random_seed,
        n_jobs=-1
    )
    clf.fit(X_train, y_train)

    # 4. Evaluation
    y_pred = clf.predict(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    prec_macro = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
    prec_weighted = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
    rec_macro = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
    rec_weighted = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
    f1_m = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
    f1_w = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

    cm = confusion_matrix(y_test, y_pred).tolist()

    # Feature importances
    feature_importances = {
        feat: round(float(imp), 4)
        for feat, imp in zip(FEATURES, clf.feature_importances_)
    }

    # 5. Save model
    joblib.dump(clf, MODEL_FILE)

    metadata = {
        "model_name": "RandomForest_EquipmentFailurePredictor",
        "algorithm": "Random Forest Classifier (Scikit-Learn)",
        "version": "1.0.0",
        "trained_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "random_seed": random_seed,
        "n_samples": n_samples,
        "train_size": len(X_train),
        "test_size": len(X_test),
        "features": FEATURES,
        "classes": CLASS_NAMES,
        "metrics": {
            "accuracy": round(acc, 4),
            "precision_macro": round(prec_macro, 4),
            "precision_weighted": round(prec_weighted, 4),
            "recall_macro": round(rec_macro, 4),
            "recall_weighted": round(rec_weighted, 4),
            "f1_macro": round(f1_m, 4),
            "f1_weighted": round(f1_w, 4)
        },
        "confusion_matrix": cm,
        "feature_importances": feature_importances,
        "hyperparameters": {
            "n_estimators": 100,
            "max_depth": 12,
            "min_samples_split": 4,
            "min_samples_leaf": 2,
            "criterion": "gini"
        },
        "limitations": (
            "This model was trained on synthetic engineering simulation data with fixed random seeds for demonstration and "
            "educational purposes. Class probabilities reflect simulated risk estimates and must not be treated as certified "
            "real-world physical failure probabilities without calibrating against domain-specific vibration spectra and equipment telemetry."
        )
    }

    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return metadata

if __name__ == "__main__":
    meta = train_and_save_model()
    print("Model successfully trained. Accuracy:", meta["metrics"]["accuracy"])
