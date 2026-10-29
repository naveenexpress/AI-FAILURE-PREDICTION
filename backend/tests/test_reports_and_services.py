def test_maintenance_recommendations(client):
    """Test 16: Maintenance recommendations endpoint returns structured recommendations."""
    res = client.get("/api/v1/maintenance/recommendations")
    assert res.status_code == 200
    recs = res.json()
    assert isinstance(recs, list)
    if len(recs) > 0:
        r = recs[0]
        assert "title" in r
        assert "category" in r
        assert "priority" in r
        assert "action_required" in r

def test_csv_exports(client):
    """Test 17: CSV export endpoints return valid CSV files with appropriate headers."""
    # Readings CSV
    r_csv = client.get("/api/v1/reports/readings.csv")
    assert r_csv.status_code == 200
    assert r_csv.headers["content-type"].startswith("text/csv")
    assert "Reading_ID,Machine_ID" in r_csv.text

    # Alerts CSV
    a_csv = client.get("/api/v1/reports/alerts.csv")
    assert a_csv.status_code == 200
    assert a_csv.headers["content-type"].startswith("text/csv")
    assert "Alert_ID,Machine_ID" in a_csv.text

def test_dashboard_stats(client):
    """Dashboard statistics endpoint returns non-empty counts and distributions."""
    res = client.get("/api/v1/dashboard/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["total_machines"] == 5
    assert "health_distribution" in data
    assert "risk_distribution" in data
    assert "average_health_score" in data

def test_simulator_generate(client):
    """Sensor simulator generates new readings and updates equipment."""
    res = client.post("/api/v1/simulator/generate", json={"mode": "normal"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["simulated_count"] == 5
