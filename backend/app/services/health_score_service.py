from typing import Tuple, List
from app.core.config import settings

def calculate_health_score(
    temperature: float,
    vibration: float,
    rotational_speed: float,
    pressure: float,
    operating_hours: float
) -> Tuple[float, List[str]]:
    """
    Computes a deterministic equipment health score from 0 to 100.
    
    Calculation Methodology:
    - Base baseline score starts at 100.0.
    - Tiered penalty deductions are applied based on deviations from nominal equipment operating bands.
    - Bounded strictly within [0.0, 100.0].
    - Disclaimer: This health score is an illustrative algorithmic health metric and not a
      certified engineering or regulatory measurement.
    """
    score = 100.0
    factors: List[str] = []

    # 1. Thermal Penalties
    if temperature > settings.TEMP_HIGH_RISK_MIN:  # > 85°C
        deduction = min(35.0, 20.0 + (temperature - settings.TEMP_HIGH_RISK_MIN) * 1.5)
        score -= deduction
        factors.append(f"Critical temperature ({temperature:.1f}°C > {settings.TEMP_HIGH_RISK_MIN}°C, -{deduction:.1f} pts)")
    elif temperature > settings.TEMP_NORMAL_MAX:  # > 70°C
        deduction = 10.0 + (temperature - settings.TEMP_NORMAL_MAX) * 0.6
        score -= deduction
        factors.append(f"Elevated operating temperature ({temperature:.1f}°C > {settings.TEMP_NORMAL_MAX}°C, -{deduction:.1f} pts)")

    # 2. Vibration Penalties
    if vibration > settings.VIB_HIGH_RISK_MIN:  # > 5.5 mm/s
        deduction = min(40.0, 25.0 + (vibration - settings.VIB_HIGH_RISK_MIN) * 3.0)
        score -= deduction
        factors.append(f"Severe mechanical vibration ({vibration:.2f} mm/s > {settings.VIB_HIGH_RISK_MIN} mm/s, -{deduction:.1f} pts)")
    elif vibration > settings.VIB_NORMAL_MAX:  # > 3.0 mm/s
        deduction = 10.0 + (vibration - settings.VIB_NORMAL_MAX) * 4.0
        score -= deduction
        factors.append(f"Elevated vibration above threshold ({vibration:.2f} mm/s > {settings.VIB_NORMAL_MAX} mm/s, -{deduction:.1f} pts)")

    # 3. Pressure Penalties
    if pressure < 1.0 or pressure > settings.PRESSURE_HIGH_RISK_MAX:
        deduction = 20.0
        score -= deduction
        factors.append(f"Severe pressure anomaly ({pressure:.2f} bar outside safe window, -{deduction:.1f} pts)")
    elif pressure < settings.PRESSURE_NORMAL_MIN or pressure > settings.PRESSURE_NORMAL_MAX:
        deduction = 8.0
        score -= deduction
        factors.append(f"Moderate pressure variance ({pressure:.2f} bar outside nominal {settings.PRESSURE_NORMAL_MIN}-{settings.PRESSURE_NORMAL_MAX} bar, -{deduction:.1f} pts)")

    # 4. Rotational Speed Anomaly
    if rotational_speed < 800.0 or rotational_speed > 4500.0:
        deduction = 15.0
        score -= deduction
        factors.append(f"Significant speed anomaly ({rotational_speed:.0f} RPM, -{deduction:.1f} pts)")
    elif rotational_speed < settings.RPM_NOMINAL_MIN or rotational_speed > settings.RPM_NOMINAL_MAX:
        deduction = 5.0
        score -= deduction
        factors.append(f"Rotational speed outside standard range ({rotational_speed:.0f} RPM, -{deduction:.1f} pts)")

    # 5. Operating Hours Service Life Wear
    if operating_hours > settings.HOURS_HIGH_RISK_THRESHOLD:  # > 10,000 hrs
        deduction = 10.0
        score -= deduction
        factors.append(f"High cumulative operating hours ({operating_hours:.0f} hrs > {settings.HOURS_HIGH_RISK_THRESHOLD:.0f} hrs, -{deduction:.1f} pts)")
    elif operating_hours > settings.HOURS_WARNING_THRESHOLD:  # > 6,000 hrs
        deduction = 5.0
        score -= deduction
        factors.append(f"Approaching major maintenance cycle ({operating_hours:.0f} hrs > {settings.HOURS_WARNING_THRESHOLD:.0f} hrs, -{deduction:.1f} pts)")

    # Bounded between 0.0 and 100.0
    final_score = max(0.0, min(100.0, score))
    if not factors:
        factors.append("All measured telemetry parameters are within nominal operational tolerances.")

    return round(final_score, 1), factors
