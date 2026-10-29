from app.db.models import Alert
from app.services.alert_service import evaluate_and_create_alerts

def test_alert_generation_and_acknowledgment(client, db_session):
    """Test 13 & 14: Alert generation on abnormal reading and alert acknowledgment."""
    # Submit abnormal reading with critical temperature
    critical_reading = {
        "machine_id": "MCH-001",
        "temperature": 92.5,
        "vibration": 6.8,
        "rotational_speed": 1490.0,
        "pressure": 3.4,
        "operating_hours": 3000.0,
        "is_simulated": True
    }
    client.post("/api/v1/readings", json=critical_reading)

    # Check that alert was generated
    alerts_res = client.get("/api/v1/alerts?machine_id=MCH-001&acknowledged=false")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) > 0

    first_alert = alerts[0]
    alert_id = first_alert["id"]
    assert first_alert["is_acknowledged"] is False

    # Acknowledge alert
    ack_res = client.patch(f"/api/v1/alerts/{alert_id}/acknowledge")
    assert ack_res.status_code == 200
    ack_data = ack_res.json()
    assert ack_data["success"] is True
    assert ack_data["alert"]["is_acknowledged"] is True
    assert ack_data["alert"]["acknowledged_at"] is not None

def test_duplicate_alert_prevention(db_session):
    """Test 15: Duplicate active alerts are prevented for the same machine and alert type."""
    # First evaluation generates alerts
    alerts1 = evaluate_and_create_alerts(
        db=db_session,
        machine_id="MCH-001",
        machine_name="Industrial Motor",
        temperature=95.0,
        vibration=6.5,
        rotational_speed=1500.0,
        pressure=3.5,
        predicted_condition="HIGH RISK",
        failure_risk_score=95.0
    )
    count1 = len(alerts1)
    assert count1 > 0

    # Second evaluation with the exact same abnormal conditions should NOT insert duplicate unacknowledged alerts
    alerts2 = evaluate_and_create_alerts(
        db=db_session,
        machine_id="MCH-001",
        machine_name="Industrial Motor",
        temperature=95.0,
        vibration=6.5,
        rotational_speed=1500.0,
        pressure=3.5,
        predicted_condition="HIGH RISK",
        failure_risk_score=95.0
    )
    assert len(alerts2) == 0
