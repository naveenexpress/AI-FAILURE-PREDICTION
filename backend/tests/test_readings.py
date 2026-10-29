def test_valid_sensor_submission(client):
    """Test 8: Valid sensor submission saves to DB and triggers prediction."""
    reading_payload = {
        "machine_id": "MCH-001",
        "temperature": 56.4,
        "vibration": 1.72,
        "rotational_speed": 1490.0,
        "pressure": 3.4,
        "operating_hours": 2450.0,
        "is_simulated": True
    }
    res = client.post("/api/v1/readings", json=reading_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["machine_id"] == "MCH-001"
    assert data["temperature"] == 56.4
    assert data["id"] is not None

def test_invalid_sensor_input(client):
    """Test 9: Invalid sensor input returns appropriate 422 error."""
    # Negative vibration
    bad_payload_vib = {
        "machine_id": "MCH-001",
        "temperature": 50.0,
        "vibration": -2.5,
        "rotational_speed": 1500.0,
        "pressure": 3.0,
        "operating_hours": 100.0
    }
    res = client.post("/api/v1/readings", json=bad_payload_vib)
    assert res.status_code == 422

    # Temperature out of physical bounds
    bad_payload_temp = {
        "machine_id": "MCH-001",
        "temperature": 999.0,
        "vibration": 1.5,
        "rotational_speed": 1500.0,
        "pressure": 3.0,
        "operating_hours": 100.0
    }
    res_temp = client.post("/api/v1/readings", json=bad_payload_temp)
    assert res_temp.status_code == 422

def test_sensor_submission_unknown_machine(client):
    """Submitting sensor readings for unknown machine returns 404."""
    payload = {
        "machine_id": "MCH-GHOST",
        "temperature": 50.0,
        "vibration": 1.5,
        "rotational_speed": 1500.0,
        "pressure": 3.0,
        "operating_hours": 100.0
    }
    res = client.post("/api/v1/readings", json=payload)
    assert res.status_code == 404

def test_get_latest_readings(client):
    """Retrieving latest readings returns entries for machines."""
    res = client.get("/api/v1/readings/latest")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 5
