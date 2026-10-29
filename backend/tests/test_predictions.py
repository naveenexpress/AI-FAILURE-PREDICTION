from app.services.health_score_service import calculate_health_score

def test_prediction_endpoint(client):
    """Test 10: Prediction endpoint returns condition, risk score, health score, factors, and recommendations."""
    payload = {
        "machine_id": "MCH-001",
        "temperature": 52.0,
        "vibration": 1.7,
        "rotational_speed": 1500.0,
        "pressure": 3.4,
        "operating_hours": 2000.0
    }
    res = client.post("/api/v1/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["predicted_condition"] in ["NORMAL", "WARNING", "HIGH RISK"]
    assert 0.0 <= data["failure_risk_score"] <= 100.0
    assert 0.0 <= data["health_score"] <= 100.0
    assert isinstance(data["contributing_factors"], list)
    assert isinstance(data["recommendations"], list)
    assert data["model_version"] == "rf-v1.0"

def test_model_feature_validation(client):
    """Test 11: Missing or invalid features trigger validation errors."""
    bad_payload = {
        "temperature": "not_a_number",
        "vibration": 1.5,
        "rotational_speed": 1500.0
        # Missing pressure and operating_hours
    }
    res = client.post("/api/v1/predict", json=bad_payload)
    assert res.status_code == 422

def test_health_score_range_and_determinism():
    """Test 12: Health score is strictly bounded [0, 100] and deterministic."""
    # Test nominal readings -> near 100
    score_normal, factors_normal = calculate_health_score(50.0, 1.5, 1500.0, 3.5, 1000.0)
    assert 90.0 <= score_normal <= 100.0
    assert len(factors_normal) >= 1

    # Test extreme severe readings -> bounded at 0.0
    score_extreme, factors_extreme = calculate_health_score(150.0, 15.0, 5000.0, 12.0, 15000.0)
    assert score_extreme == 0.0
    assert len(factors_extreme) >= 3

    # Determinism test
    s1, f1 = calculate_health_score(75.0, 3.8, 1400.0, 5.8, 7000.0)
    s2, f2 = calculate_health_score(75.0, 3.8, 1400.0, 5.8, 7000.0)
    assert s1 == s2
    assert f1 == f2
