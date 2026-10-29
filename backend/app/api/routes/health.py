import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db
from app.ml.model_loader import get_model_metadata

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health(db: Session = Depends(get_db)):
    """Health check endpoint verifying backend API, database connectivity, and ML model status."""
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    model_meta = get_model_metadata()
    model_status = "loaded" if model_meta else "uninitialized"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "database": db_status,
        "model": {
            "status": model_status,
            "version": model_meta.get("version", "unknown"),
            "accuracy": model_meta.get("metrics", {}).get("accuracy")
        },
        "version": "1.0.0",
        "environment": "development/prototype"
    }
