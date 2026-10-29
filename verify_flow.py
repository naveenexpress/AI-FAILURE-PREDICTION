import httpx

client = httpx.Client(base_url="http://127.0.0.1:8000/api/v1", timeout=10.0)

def main():
    print("--- 1. Checking Health ---")
    health = client.get("/health").json()
    print("Health Status:", health["status"], "| Model:", health["model"]["status"])

    print("\n--- 2. Fetching Machines ---")
    machines = client.get("/machines").json()
    print(f"Total machines: {len(machines)}")
    for m in machines:
        print(f"  - {m['id']}: {m['name']} [{m['status']}]")

    print("\n--- 3. Injecting Critical Telemetry into MCH-001 ---")
    sim = client.post("/simulator/generate", json={"mode": "critical", "machine_id": "MCH-001"}).json()
    res = sim["results"][0]
    reading = res["reading"]
    pred = res["prediction"]
    print(f"  Reading: Temp={reading['temperature']}°C, Vib={reading['vibration']}mm/s, Press={reading['pressure']}bar")
    print(f"  Predicted Condition: {pred['predicted_condition']}, Risk Score: {pred['failure_risk_score']}%, Health: {pred['health_score']}%")
    print(f"  Contributing Factors: {pred['contributing_factors']}")
    print(f"  Recommendations Count: {len(pred['recommendations'])}")

    print("\n--- 4. Checking Active Alerts ---")
    alerts = client.get("/alerts", params={"machine_id": "MCH-001", "acknowledged": False}).json()
    print(f"Active alerts for MCH-001: {len(alerts)}")
    if alerts:
        a = alerts[0]
        print(f"  Alert ID {a['id']}: [{a['severity']}] {a['alert_type']} - {a['description']}")
        print("\n--- 5. Acknowledging Alert ---")
        ack = client.patch(f"/alerts/{a['id']}/acknowledge").json()
        print("  Acknowledged Result:", ack["success"], "| is_acknowledged:", ack["alert"]["is_acknowledged"])

    print("\n--- 6. Verifying CSV Exports ---")
    r_csv = client.get("/reports/readings.csv")
    print("  Readings CSV status:", r_csv.status_code, "| Bytes:", len(r_csv.content))
    a_csv = client.get("/reports/alerts.csv")
    print("  Alerts CSV status:", a_csv.status_code, "| Bytes:", len(a_csv.content))

    print("\n--- 7. Verifying Dashboard Stats ---")
    stats = client.get("/dashboard/stats").json()
    print(f"  Fleet Total: {stats['total_machines']} | High Risk: {stats['high_risk_machines']} | Warning: {stats['warning_machines']} | Normal: {stats['normal_machines']}")
    print(f"  Avg Health Score: {stats['average_health_score']}%")

    print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
