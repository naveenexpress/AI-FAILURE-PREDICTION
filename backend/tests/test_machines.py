import pytest
from app.db.models import Machine
from app.db.init_db import init_db

def test_sample_data_seeding(db_session, client):
    """Test 2 & 3: Database initialization and sample data seeding."""
    machines = db_session.query(Machine).all()
    assert len(machines) == 5
    machine_ids = {m.id for m in machines}
    assert "MCH-001" in machine_ids
    assert "MCH-002" in machine_ids
    assert "MCH-003" in machine_ids
    assert "MCH-004" in machine_ids
    assert "MCH-005" in machine_ids

    # Idempotent re-run of init_db must not create duplicate records
    init_db(db=db_session)
    machines_after = db_session.query(Machine).all()
    assert len(machines_after) == 5

def test_machine_creation_and_duplicate_rejection(client):
    """Test 4 & 5: Machine creation and duplicate machine rejection."""
    new_machine = {
        "id": "MCH-006",
        "name": "Robotic Welding Cell",
        "type": "Welding Robot",
        "location": "Fabrication Plant 2",
        "installation_date": "2024-06-01",
        "status": "NORMAL",
        "description": "6-axis arc welding robot with optical seam tracking."
    }
    # Create machine
    res = client.post("/api/v1/machines", json=new_machine)
    assert res.status_code == 201
    created = res.json()
    assert created["id"] == "MCH-006"
    assert created["name"] == "Robotic Welding Cell"

    # Reject duplicate ID
    duplicate_res = client.post("/api/v1/machines", json=new_machine)
    assert duplicate_res.status_code == 400
    assert "already exists" in duplicate_res.json()["detail"].lower()

def test_machine_retrieval_and_update(client):
    """Test 6: Machine retrieval and updates."""
    # Retrieve
    res = client.get("/api/v1/machines/MCH-001")
    assert res.status_code == 200
    data = res.json()
    assert data["machine"]["id"] == "MCH-001"
    assert "readings" in data
    assert "predictions" in data

    # Update
    update_data = {
        "location": "Bay 1 - Main Production Hall",
        "status": "WARNING"
    }
    update_res = client.put("/api/v1/machines/MCH-001", json=update_data)
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["location"] == "Bay 1 - Main Production Hall"
    assert updated["status"] == "WARNING"

def test_unknown_machine_handling(client):
    """Test 18: Unknown machine returns 404."""
    res = client.get("/api/v1/machines/MCH-NONEXISTENT")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

def test_machine_deletion_policy(client):
    """Test 7: Machine deletion policy prevents accidental loss without force."""
    # MCH-001 has seeded historical readings, so default delete without force must fail with 409 Conflict
    res_conflict = client.delete("/api/v1/machines/MCH-001")
    assert res_conflict.status_code == 409
    assert "force=true" in res_conflict.json()["detail"].lower()

    # Deleting with ?force=true must cascade and succeed
    res_force = client.delete("/api/v1/machines/MCH-001?force=true")
    assert res_force.status_code == 200
    assert res_force.json()["success"] is True

    # Machine must no longer exist
    res_check = client.get("/api/v1/machines/MCH-001")
    assert res_check.status_code == 404
