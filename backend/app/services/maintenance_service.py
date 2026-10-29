from typing import List, Dict
from app.core.config import settings

def get_recommendations_for_readings(
    temperature: float,
    vibration: float,
    rotational_speed: float,
    pressure: float,
    operating_hours: float,
    predicted_condition: str
) -> List[Dict[str, str]]:
    """
    Evaluates telemetry readings and returns rule-based preventive maintenance recommendations.
    
    Adheres to engineering caution: recommends structured inspection, verification, and non-destructive
    testing rather than asserting unconfirmed physical component failures.
    """
    recs: List[Dict[str, str]] = []

    # 1. Temperature checks
    if temperature > settings.TEMP_HIGH_RISK_MIN:
        recs.append({
            "title": "Immediate Thermal Circuit & Lubrication Inspection",
            "category": "THERMAL",
            "priority": "HIGH",
            "action_required": "Inspect cooling lines, clean heat exchanger fins, check lubricant viscosity, and check coolant pump pressure.",
            "rationale": f"Measured temperature ({temperature:.1f}°C) exceeded critical limit ({settings.TEMP_HIGH_RISK_MIN}°C)."
        })
    elif temperature > settings.TEMP_NORMAL_MAX:
        recs.append({
            "title": "Cooling System and Lubricant Level Check",
            "category": "THERMAL",
            "priority": "MEDIUM",
            "action_required": "Verify coolant flow rate, inspect fluid reservoir levels, and clean external ventilation shrouds.",
            "rationale": f"Operating temperature ({temperature:.1f}°C) is above normal threshold ({settings.TEMP_NORMAL_MAX}°C)."
        })

    # 2. Vibration checks
    if vibration > settings.VIB_HIGH_RISK_MIN:
        recs.append({
            "title": "Vibration Analysis & Bearing Assembly Inspection",
            "category": "MECHANICAL",
            "priority": "HIGH",
            "action_required": "Perform high-resolution FFT vibration spectrum analysis. Check foundation anchor bolt torque, dynamic rotor balance, and bearing cage condition.",
            "rationale": f"Vibration velocity ({vibration:.2f} mm/s) crossed severe hazard threshold ({settings.VIB_HIGH_RISK_MIN} mm/s)."
        })
    elif vibration > settings.VIB_NORMAL_MAX:
        recs.append({
            "title": "Mechanical Alignment & Shaft Coupling Verification",
            "category": "MECHANICAL",
            "priority": "MEDIUM",
            "action_required": "Check laser shaft alignment, flexible coupling condition, and mounting integrity.",
            "rationale": f"Vibration level ({vibration:.2f} mm/s) exceeds standard smooth-running boundary ({settings.VIB_NORMAL_MAX} mm/s)."
        })

    # 3. Pressure checks
    if pressure < 1.0 or pressure > settings.PRESSURE_HIGH_RISK_MAX:
        recs.append({
            "title": "Critical Pressure Relief and Seal Integrity Inspection",
            "category": "MECHANICAL",
            "priority": "HIGH",
            "action_required": "Test safety relief valves, inspect primary mechanical seals for blow-by, and check line pressure regulators.",
            "rationale": f"Line pressure ({pressure:.2f} bar) is outside acceptable pressure safety envelope."
        })
    elif pressure < settings.PRESSURE_NORMAL_MIN or pressure > settings.PRESSURE_NORMAL_MAX:
        recs.append({
            "title": "Pressure Line & Filter Differential Verification",
            "category": "MECHANICAL",
            "priority": "LOW",
            "action_required": "Replace or clean line filters, calibrate pressure transducer, and check for minor pneumatic/hydraulic leaks.",
            "rationale": f"Line pressure ({pressure:.2f} bar) deviates from nominal band ({settings.PRESSURE_NORMAL_MIN}-{settings.PRESSURE_NORMAL_MAX} bar)."
        })

    # 4. Rotational speed checks
    if rotational_speed < 800.0 or rotational_speed > 4200.0:
        recs.append({
            "title": "Drive Controller & Tachometer Calibration",
            "category": "ELECTRICAL",
            "priority": "HIGH",
            "action_required": "Inspect variable frequency drive (VFD) output parameters, test optical speed encoder, and check motor slip.",
            "rationale": f"Rotational speed ({rotational_speed:.0f} RPM) deviates markedly from design velocity."
        })

    # 5. Operating hours checks
    if operating_hours >= settings.HOURS_HIGH_RISK_THRESHOLD:
        recs.append({
            "title": "Scheduled Major Equipment Overhaul",
            "category": "INSPECTION",
            "priority": "HIGH",
            "action_required": "Schedule full preventative overhaul, replace consumables, inspect internal gearing, and renew all elastomeric seals.",
            "rationale": f"Cumulative service hours ({operating_hours:.0f} hrs) exceed manufacturer major service interval ({settings.HOURS_HIGH_RISK_THRESHOLD:.0f} hrs)."
        })
    elif operating_hours >= settings.HOURS_WARNING_THRESHOLD:
        recs.append({
            "title": "Routine Preventive Maintenance Interval",
            "category": "INSPECTION",
            "priority": "LOW",
            "action_required": "Perform routine grease lubrication replenishment, belt tension check, and electrical terminal retorquing.",
            "rationale": f"Cumulative service hours ({operating_hours:.0f} hrs) have reached standard maintenance checkpoint."
        })

    # 6. Overall health check if condition is normal and no specific rule triggered
    if not recs and predicted_condition == "NORMAL":
        recs.append({
            "title": "Standard Condition Monitoring & Inspection",
            "category": "INSPECTION",
            "priority": "LOW",
            "action_required": "Continue standard telemetry monitoring. Record regular shift inspection log.",
            "rationale": "Equipment telemetry demonstrates healthy performance within all design parameters."
        })

    return recs
