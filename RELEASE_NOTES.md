# AI Equipment Failure Prediction System v1.0.0

Production release for the AI-Based Equipment Failure Prediction and Industrial Condition Monitoring platform.

## Release Highlights

- **Multi-Channel Industrial Telemetry Dashboard**: Live monitoring for Temperature (°C), Vibration velocity (mm/s), Rotational Speed (RPM), Pressure (bar), and Operating Hours with interactive Recharts visualizations.
- **AI Condition Classification & Risk Scoring**: Scikit-Learn Random Forest Classifier (100 estimators) categorizing machinery condition into `NORMAL`, `WARNING`, and `HIGH RISK` with continuous 0–100% failure probability and explainable factor decomposition.
- **Deterministic Health Scoring**: 0–100 multi-penalty health evaluation across industrial operating envelopes.
- **Automated Alarm Management**: Threshold and AI risk alerts with stateful deduplication and operator acknowledgment lifecycles.
- **Prescriptive Maintenance Actions**: Actionable corrective procedures linked to detected sensor anomalies.
- **Synthetic Telemetry Simulator**: In-app normal, warning escalation, and critical spike telemetry generation.
- **Reporting & Data Export**: Safe CSV export endpoints for telemetry logs and alert histories.
- **Model Sandbox**: Live model metrics (Accuracy, Precision, Recall, F1, Confusion Matrix) with in-browser retraining.

## Release Artifacts

- **Compiled Frontend Web Application**: `frontend-dist-v1.0.0.zip`
- **Checksums**: `checksums.txt`
  - `dc8f1e92907d88e3ada4ae487e08674dda89641b679edb16233bbb21700fde93  frontend-dist-v1.0.0.zip`

## Installation & Deployment

Extract `frontend-dist-v1.0.0.zip` and serve using any static web server (Nginx, Caddy, Apache, or AWS S3/CloudFront) pointing API requests to the FastAPI backend running on port 8000.
