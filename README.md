# AI-Based Equipment Failure Prediction System

An end-to-end industrial condition monitoring, predictive maintenance, and equipment failure risk analytics platform. The system ingests multi-channel sensor telemetry, calculates deterministic equipment health scores, executes a Scikit-Learn Random Forest Classifier to forecast imminent failure risk, triggers deduplicated condition alerts, and prescribes actionable preventive maintenance protocols.

---

## Architecture Overview

```
+---------------------------------------------------------------------------------------+
|                                    REACT FRONTEND                                     |
|  React 19 + TypeScript + Vite + Tailwind CSS v4 + Recharts + Lucide Icons            |
|  (Dashboard, Fleet Management, Sensor Stream, AI Predictions, Alerts, Reports)        |
+-------------------------------------------+-------------------------------------------+
                                            | REST API (/api/v1)
                                            v
+---------------------------------------------------------------------------------------+
|                                   FASTAPI BACKEND                                     |
|  FastAPI + Uvicorn + Pydantic v2 + SQLAlchemy 2.x                                     |
|  - Health Scoring Engine (0 - 100 Deterministic Multi-Penalty Metric)                 |
|  - Alert Evaluation Service (Duplicate Prevention & Life-cycle Acknowledgment)        |
|  - Preventive Maintenance Engine (Prescriptive Action Mapping)                        |
|  - Synthetic Telemetry Simulator (Normal, Warning, Critical Modes)                    |
+---------------------+-----------------------------------------+-----------------------+
                      |                                         |
                      v                                         v
+-------------------------------+                     +---------------------------------+
|        SQLITE DATABASE        |                     |    SCIKIT-LEARN ML PIPELINE     |
|  - machines                   |                     |  - Random Forest Classifier     |
|  - sensor_readings            |                     |  - Synthetic Data Generator     |
|  - predictions                |                     |  - Model Persistence (.joblib)  |
|  - alerts                     |                     |  - Feature Importance Rankings  |
|  - maintenance_recommendations|                     |  - Live Retraining API          |
+-------------------------------+                     +---------------------------------+
```

---

## Implemented Features

1. **Industrial Telemetry Dashboard**:
   - Fleet-wide KPI counters: Total Equipment, Normal, Warning, High Risk, and Average Health Score.
   - Interactive Recharts visualization for live multi-sensor trend lines (temperature, vibration, pressure, RPM).
   - Categorical health distributions and failure risk proportion breakdowns.
   - Real-time recent alert stream with inline operator acknowledgment.

2. **Fleet Management**:
   - Equipment inventory management with status tracking (`NORMAL`, `WARNING`, `HIGH RISK`).
   - Pre-seeded industrial assets: Industrial Motor, Centrifugal Pump, Conveyor Belt, Industrial Compressor, CNC Machine.
   - Safe deletion policy requiring explicit confirmation (`?force=true`) when historical records exist.

3. **Multi-Channel Sensor Telemetry Stream**:
   - Real-time sensor monitoring: Temperature (°C), Vibration velocity (mm/s), Rotational Speed (RPM), Pressure (bar), and Operating Hours.
   - Manual sensor submission interface for direct test-case evaluation.
   - Immediate ingestion into SQLite with automatic inference evaluation on every reading.

4. **Deterministic Health Scoring**:
   - 0–100 deterministic health metric calculating cumulative penalty subtractions based on threshold severity across temperature, vibration, rotational speed, pressure envelope, and total service run-time.

5. **AI Imminent Failure Classification**:
   - Scikit-Learn Random Forest Classifier (100 estimators) classifying conditions into `NORMAL`, `WARNING`, and `HIGH RISK`.
   - Continuous 0–100% failure risk score derived from class probabilities.
   - Explainable AI breakdown displaying explicit contributing factors for each prediction.

6. **Automated Real-Time Alarms**:
   - Automatic alarm triggering on critical sensor thresholds and elevated AI risk scores.
   - Stateful deduplication preventing multiple unacknowledged alarms of the same type on the same equipment.
   - Timestamped operator acknowledgment workflow.

7. **Prescriptive Maintenance Protocols**:
   - Actionable preventive procedures mapped to anomaly types (vibration spectrum FFT analysis, laser shaft alignment, cooling circuit inspection, pressure valve checks).
   - Filterable by machinery and maintenance category (Mechanical, Thermal, Lubrication, Electrical, Inspection).

8. **Synthetic Telemetry Simulator**:
   - In-app telemetry simulator generating realistic multi-sensor telemetry across Normal, Warning escalation, and Critical spike scenarios.

9. **Reports & Safe CSV Exports**:
   - Time-window and equipment filtering for telemetry, predictions, and alerts.
   - Export endpoints: `GET /api/v1/reports/readings.csv` and `GET /api/v1/reports/alerts.csv`.

10. **ML Retraining Sandbox**:
    - Live model evaluation metrics: Accuracy, Precision, Recall, F1-Score, and 3x3 Confusion Matrix.
    - Feature importance breakdown across all sensor variables.
    - Interactive retraining sandbox with customizable sample size ($N$) and random seed.

---

## Tech Stack

| Component | Technologies |
|:---|:---|
| **Backend** | Python 3.11+, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2 |
| **Machine Learning** | Scikit-Learn (Random Forest), NumPy, Pandas, Joblib |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Recharts, Lucide React |
| **Database** | SQLite with automated schema initialization |
| **Testing & CI** | Pytest, FastAPI TestClient, Oxlint, GitHub Actions CI |

---

## Prerequisites

- **Python**: 3.11 or newer (`python --version`)
- **Node.js**: 18.0 or newer and npm (`node --version`, `npm --version`)
- **Git**: Installed and configured (`git --version`)

---

## Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/naveenexpress/AI-FAILURE-PREDICTION.git
cd AI-FAILURE-PREDICTION
```

### 2. Backend Setup

Open a terminal in the project root:

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (optional but recommended)
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Train the baseline ML model artifact
python -m app.ml.train_model

# Run automated tests
python -m pytest -v

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive Swagger API documentation is available at:
`http://127.0.0.1:8000/docs`

### 3. Frontend Setup

Open a second terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start Vite dev server on port 5173
npm run dev
```

Access the frontend dashboard at:
`http://127.0.0.1:5173`

---

## Environment Configuration

### Backend (`backend/.env`)

```env
PROJECT_NAME="AI-Based Equipment Failure Prediction System"
API_V1_STR="/api/v1"
DATABASE_URL="sqlite:///./equipment_failure_prediction.db"
CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
MODEL_DIR="app/ml/models"
RANDOM_SEED=42
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## API Reference Summary

All endpoints are prefixed with `/api/v1`:

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/health` | System health, database connectivity, and ML model status |
| `GET` | `/machines` | List equipment with optional query and status filters |
| `POST` | `/machines` | Register a new industrial machine unit |
| `GET` | `/machines/{id}` | Detailed status, recent telemetry, predictions, and active alerts |
| `DELETE` | `/machines/{id}` | Delete machine (supports `?force=true` for safe cascade) |
| `GET` | `/readings/latest` | Retrieve latest sensor telemetry across all equipment |
| `POST` | `/readings` | Ingest sensor reading and compute immediate prediction |
| `POST` | `/predictions/evaluate` | Evaluate ad-hoc sensor data against the ML model |
| `GET` | `/alerts` | List alerts filtered by machine, severity, and acknowledgment |
| `PATCH` | `/alerts/{id}/acknowledge` | Acknowledge active alarm |
| `GET` | `/maintenance` | List recommended maintenance protocols |
| `POST` | `/simulator/generate` | Generate synthetic telemetry (normal, warning, critical) |
| `GET` | `/reports/readings.csv` | Export telemetry log as CSV |
| `GET` | `/reports/alerts.csv` | Export alerts history as CSV |
| `GET` | `/model/info` | ML model evaluation metrics, confusion matrix, and feature importances |
| `POST` | `/model/retrain` | Retrain Random Forest model with custom sample size |

---

## Testing & Verification

### Pytest Backend Suite

The test suite covers database seeding, duplicate rejection, condition prediction, health score determinism, alert lifecycle, and CSV reporting:

```bash
cd backend
python -m pytest -v
```

Output:
```
======================= 19 passed, 2 warnings in 1.42s ========================
```

### End-to-End Verification Script

Run the automated end-to-end integration flow:

```bash
python verify_flow.py
```

### Frontend Typecheck & Build

```bash
cd frontend
npm run build
```

---

## Production Build

To build the static web application for production deployment:

```bash
cd frontend
npm run build
```

The compiled assets will be generated in `frontend/dist/`.

---

## Releases & Downloads

Pre-built web distribution packages and checksums are available on the [GitHub Releases page](https://github.com/naveenexpress/AI-FAILURE-PREDICTION/releases).

---

## Project Structure

```
AI-FAILURE-PREDICTION/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Automated Pytest and frontend build CI
│       └── release.yml            # Tag-triggered release packaging workflow
├── backend/
│   ├── app/
│   │   ├── api/routes/            # REST API endpoints (health, machines, alerts, etc.)
│   │   ├── core/                  # Application configuration & threshold constants
│   │   ├── db/                    # SQLAlchemy models, SQLite connection, and initial seeds
│   │   ├── ml/                    # Synthetic generator, RF model trainer, and loader
│   │   │   └── models/            # Serialized model (.joblib) and metadata JSON
│   │   ├── schemas/               # Pydantic validation schemas
│   │   ├── services/              # Health scoring, alert service, and simulator
│   │   └── main.py                # FastAPI entry point and CORS configuration
│   ├── tests/                     # 19 automated Pytest test cases
│   ├── requirements.txt           # Python dependencies
│   └── .env.example               # Backend environment template
├── frontend/
│   ├── public/
│   │   └── favicon.svg            # Industrial status icon
│   ├── src/
│   │   ├── api/client.ts          # Typed REST API client
│   │   ├── components/            # Reusable UI components (Navbar, Sidebar, MetricCard, etc.)
│   │   ├── pages/                 # Views (Dashboard, Fleet, Sensors, Predictions, Alerts, etc.)
│   │   ├── types/index.ts         # TypeScript data contracts
│   │   ├── App.tsx                # Application layout & active view router
│   │   ├── main.tsx               # React DOM entry point
│   │   └── index.css              # Tailwind CSS styles
│   ├── package.json               # Node dependencies & scripts
│   ├── vite.config.ts             # Vite configuration
│   ├── tsconfig.json              # TypeScript project configuration
│   └── .env.example               # Frontend environment template
├── verify_flow.py                 # E2E integration verification script
├── .gitignore                     # Git ignore rules for Python, Node, and SQLite
├── LICENSE                        # MIT License
└── README.md                      # Comprehensive documentation
```

---

## Limitations & Scope

- **Prototype Context**: Designed as an industrial condition monitoring engineering prototype. Telemetry is streamed via HTTP REST and synthetic generators rather than direct hardware PLC protocols (such as OPC-UA, Modbus, or MQTT).
- **Data Persistence**: Configured with local SQLite database for zero-configuration local evaluation. Production environments should use PostgreSQL or a time-series database (e.g. TimescaleDB).

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`.
3. Commit your changes: `git commit -m "Add feature"`.
4. Push to the branch: `git push origin feature/your-feature-name`.
5. Open a Pull Request.

---

## License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
