import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.db.init_db import init_db
from app.ml.model_loader import get_model
from app.api.routes import (
    health,
    machines,
    readings,
    predictions,
    alerts,
    maintenance,
    model_routes,
    reports,
    dashboard,
    simulator
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("equipment_failure_prediction")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database schema, seed initial sample machines, and ensure ML model is loaded
    logger.info("Initializing database and verifying sample equipment...")
    init_db()
    logger.info("Ensuring Machine Learning model is loaded and ready...")
    get_model()
    logger.info("Application startup complete. Ready to receive requests.")
    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "AI-Based Equipment Failure Prediction System API. "
        "Provides industrial sensor monitoring, condition prediction, automated risk alerts, "
        "and preventive maintenance recommendations."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local Vite frontend & dynamic ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler to avoid leaking internal stack traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred while processing your request. Please check application logs.",
            "path": request.url.path
        }
    )

# Include Routers under API_V1_STR (/api/v1)
api_prefix = settings.API_V1_STR

app.include_router(health.router, prefix=api_prefix)
app.include_router(machines.router, prefix=api_prefix)
app.include_router(readings.router, prefix=api_prefix)
app.include_router(predictions.router, prefix=api_prefix)
app.include_router(alerts.router, prefix=api_prefix)
app.include_router(maintenance.router, prefix=api_prefix)
app.include_router(model_routes.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(simulator.router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": "1.0.0",
        "api_docs": "/docs",
        "health_check": f"{settings.API_V1_STR}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
