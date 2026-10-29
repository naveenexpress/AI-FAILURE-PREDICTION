def test_health_endpoint(client):
    """Test 1: Health endpoint returns 200, status healthy, and model info."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "healthy"
    assert "model" in data
    assert data["model"]["status"] == "loaded"
    assert "version" in data
