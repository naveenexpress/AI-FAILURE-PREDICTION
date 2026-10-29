import numpy as np
import pandas as pd
from typing import Tuple

FEATURES = [
    "temperature",
    "vibration",
    "rotational_speed",
    "pressure",
    "operating_hours"
]

CLASS_NAMES = ["NORMAL", "WARNING", "HIGH RISK"]

def generate_synthetic_dataset(
    n_samples: int = 3000,
    random_seed: int = 42
) -> pd.DataFrame:
    """
    Generates a synthetic engineering dataset for industrial equipment condition monitoring.
    
    Documented Distribution Patterns:
    1. NORMAL (Class 0):
       - Equipment operates within nominal manufacturer design envelopes.
       - Temperature: mean 52°C, std 5°C [35 - 68°C]
       - Vibration: mean 1.8 mm/s, std 0.4 mm/s [0.5 - 2.9 mm/s]
       - Rotational Speed: mean 1500 RPM, std 40 RPM [1400 - 1620 RPM]
       - Pressure: mean 3.5 bar, std 0.4 bar [2.2 - 4.8 bar]
       - Operating Hours: Uniform [100 - 5500 hrs]
       
    2. WARNING (Class 1):
       - Early-stage degradation (incipient bearing wear, coolant degradation, mild misalignment).
       - Temperature: [68 - 84°C] OR
       - Vibration: [3.0 - 5.4 mm/s] OR
       - Rotational Speed: [1200 - 1390 RPM] or [1630 - 1850 RPM] OR
       - Pressure: [1.5 - 2.1 bar] or [4.9 - 6.8 bar] OR
       - Operating Hours: [6000 - 12000 hrs] with minor anomalies
       
    3. HIGH RISK (Class 2):
       - Critical impending failure (severe thermal runaway, bearing breakdown, overpressure/cavitation).
       - Temperature: > 85°C OR
       - Vibration: > 5.5 mm/s OR
       - Pressure: < 1.2 bar or > 7.0 bar OR
       - Rotational Speed: < 1000 RPM or > 2100 RPM OR
       - Compound anomalies (e.g., Temp > 76°C and Vibration > 4.5 mm/s)
    """
    rng = np.random.RandomState(random_seed)

    # 55% Normal, 28% Warning, 17% High Risk
    n_normal = int(n_samples * 0.55)
    n_warning = int(n_samples * 0.28)
    n_high_risk = n_samples - n_normal - n_warning

    # --- Generate NORMAL Samples ---
    norm_temp = rng.normal(loc=52.0, scale=4.5, size=n_normal).clip(35.0, 68.0)
    norm_vib = rng.normal(loc=1.8, scale=0.35, size=n_normal).clip(0.6, 2.8)
    norm_rpm = rng.normal(loc=1500.0, scale=35.0, size=n_normal).clip(1400.0, 1600.0)
    norm_press = rng.normal(loc=3.5, scale=0.35, size=n_normal).clip(2.5, 4.6)
    norm_hours = rng.uniform(low=100.0, high=5200.0, size=n_normal)
    norm_target = np.zeros(n_normal, dtype=int)

    # --- Generate WARNING Samples ---
    # Sub-cases of warning modes
    warn_temp = rng.normal(loc=74.0, scale=4.0, size=n_warning).clip(68.5, 84.0)
    warn_vib = rng.normal(loc=3.8, scale=0.5, size=n_warning).clip(3.0, 5.3)
    # Some with abnormal rpm, some normal rpm
    warn_rpm = rng.choice([1320.0, 1500.0, 1680.0], size=n_warning) + rng.normal(0, 30.0, size=n_warning)
    warn_press = rng.normal(loc=5.4, scale=0.6, size=n_warning).clip(1.6, 6.7)
    warn_hours = rng.uniform(low=4500.0, high=8500.0, size=n_warning)
    warn_target = np.ones(n_warning, dtype=int)

    # --- Generate HIGH RISK Samples ---
    # High risk anomalies
    risk_temp = rng.normal(loc=89.0, scale=5.0, size=n_high_risk).clip(85.0, 115.0)
    risk_vib = rng.normal(loc=6.4, scale=1.0, size=n_high_risk).clip(5.5, 12.0)
    risk_rpm = rng.choice([950.0, 1450.0, 2200.0], size=n_high_risk) + rng.normal(0, 50.0, size=n_high_risk)
    risk_press = rng.choice([0.8, 7.5], size=n_high_risk) + rng.normal(0, 0.3, size=n_high_risk)
    risk_hours = rng.uniform(low=6000.0, high=14000.0, size=n_high_risk)
    risk_target = np.full(n_high_risk, 2, dtype=int)

    # Combine
    temp = np.concatenate([norm_temp, warn_temp, risk_temp])
    vib = np.concatenate([norm_vib, warn_vib, risk_vib])
    rpm = np.concatenate([norm_rpm, warn_rpm, risk_rpm])
    press = np.concatenate([norm_press, warn_press, risk_press])
    hours = np.concatenate([norm_hours, warn_hours, risk_hours])
    target = np.concatenate([norm_target, warn_target, risk_target])

    # Add realistic measurement noise
    temp += rng.normal(0, 0.3, size=n_samples)
    vib += rng.normal(0, 0.05, size=n_samples)
    rpm += rng.normal(0, 5.0, size=n_samples)
    press += rng.normal(0, 0.04, size=n_samples)
    hours += rng.uniform(0, 1.0, size=n_samples)

    df = pd.DataFrame({
        "temperature": np.round(temp, 2),
        "vibration": np.round(vib, 2),
        "rotational_speed": np.round(rpm, 1),
        "pressure": np.round(press, 2),
        "operating_hours": np.round(hours, 1),
        "condition": target
    })

    # Shuffle
    df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)
    return df
