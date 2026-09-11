"""Physics-based, structured explanations for sampled conjunction events.

The thresholds in this module are configurable project demonstration/
engineering thresholds.  They provide operator context and do not alter the
miss-distance classification performed by :mod:`collision_engine.risk`.
"""

from __future__ import annotations

from datetime import timedelta
from math import isfinite
from typing import Any

from .risk import HIGH_MISS_DISTANCE_KM, MEDIUM_MISS_DISTANCE_KM


ELEVATED_RELATIVE_VELOCITY_KM_S = 5.0
HIGH_RELATIVE_VELOCITY_KM_S = 10.0
IMMINENT_TCA_HOURS = 1.0
ELEVATED_TCA_HOURS = 24.0


def _require_non_negative_number(value: float, label: str) -> float:
    if (
        not isinstance(value, (int, float))
        or isinstance(value, bool)
        or not isfinite(value)
        or value < 0
    ):
        raise ValueError(f"{label} must be a finite, non-negative numeric value")
    return float(value)


def _factor(name: str, value: str, severity: str, reason: str) -> dict[str, str]:
    return {"name": name, "value": value, "severity": severity, "reason": reason}


def explain_miss_distance(miss_distance_km: float) -> dict[str, str]:
    """Explain separation at closest sampled approach using project thresholds."""
    distance = _require_non_negative_number(miss_distance_km, "miss_distance_km")
    if distance <= HIGH_MISS_DISTANCE_KM:
        return _factor(
            "Miss Distance",
            f"{distance:.3f} km",
            "VERY HIGH",
            "The predicted separation is at or below the project's high-risk demonstration threshold.",
        )
    if distance <= MEDIUM_MISS_DISTANCE_KM:
        return _factor(
            "Miss Distance",
            f"{distance:.3f} km",
            "HIGH",
            "The predicted separation is within the project's elevated-risk demonstration range.",
        )
    return _factor(
        "Miss Distance",
        f"{distance:.3f} km",
        "LOW",
        "The predicted separation exceeds the project's configured risk thresholds.",
    )


def explain_relative_velocity(relative_velocity_km_s: float) -> dict[str, str]:
    """Explain encounter speed independently of the risk classification."""
    velocity = _require_non_negative_number(relative_velocity_km_s, "relative_velocity_km_s")
    if velocity >= HIGH_RELATIVE_VELOCITY_KM_S:
        severity = "HIGH"
        reason = "The objects have a high relative encounter speed, increasing the severity of any close approach."
    elif velocity >= ELEVATED_RELATIVE_VELOCITY_KM_S:
        severity = "ELEVATED"
        reason = "The objects have an elevated relative encounter speed."
    else:
        severity = "LOW"
        reason = "The objects have a comparatively low relative encounter speed."
    return _factor("Relative Velocity", f"{velocity:.3f} km/s", severity, reason)


def _format_time_to_tca(time_to_tca: timedelta) -> str:
    seconds = time_to_tca.total_seconds()
    if seconds <= 0:
        return "Now"
    minutes = seconds / 60
    if minutes < 60:
        return f"{max(1, round(minutes))} min"
    hours = seconds / 3600
    if hours < 24:
        return f"{hours:.1f} h"
    return f"{hours / 24:.1f} d"


def explain_time_to_tca(time_to_tca: timedelta | None) -> dict[str, str]:
    """Explain available response time, or explicitly report when it is unknown."""
    if time_to_tca is None:
        return _factor(
            "Time to TCA",
            "Unavailable",
            "UNAVAILABLE",
            "No analysis reference time was supplied, so time remaining cannot be determined.",
        )
    if not isinstance(time_to_tca, timedelta):
        raise TypeError("time_to_tca must be a timedelta or None")

    hours = time_to_tca.total_seconds() / 3600
    if hours <= 0:
        severity = "IMMINENT"
        reason = "The closest approach is occurring now or has already passed the analysis reference time."
    elif hours <= IMMINENT_TCA_HOURS:
        severity = "IMMINENT"
        reason = "The closest approach is soon, reducing the available response time."
    elif hours <= ELEVATED_TCA_HOURS:
        severity = "ELEVATED"
        reason = "The closest approach is within the next day and should be monitored in the analysis window."
    else:
        severity = "LOW"
        reason = "The closest approach is outside the near-term response window."
    return _factor("Time to TCA", _format_time_to_tca(time_to_tca), severity, reason)


def build_risk_explanation(
    risk_level: str,
    miss_distance_km: float,
    relative_velocity_km_s: float,
    time_to_tca: timedelta | None = None,
) -> dict[str, Any]:
    """Build an API-ready explanation from the conjunction's physical indicators.

    ``risk_level`` remains the output of the existing miss-distance classifier;
    speed and timing add operational context but never recalculate that level.
    """
    if risk_level not in {"HIGH", "MEDIUM", "LOW"}:
        raise ValueError("risk_level must be HIGH, MEDIUM, or LOW")

    factors = [
        explain_miss_distance(miss_distance_km),
        explain_relative_velocity(relative_velocity_km_s),
        explain_time_to_tca(time_to_tca),
    ]
    primary_risk_drivers = [
        factor["name"]
        for factor in factors
        if factor["severity"] in {"VERY HIGH", "HIGH", "ELEVATED", "IMMINENT"}
    ]
    if primary_risk_drivers:
        drivers = ", ".join(driver.lower() for driver in primary_risk_drivers)
        summary = f"{risk_level} collision risk under the project's configured miss-distance thresholds, driven by {drivers}."
    else:
        summary = f"{risk_level} collision risk under the project's configured miss-distance thresholds."
    return {
        "summary": summary,
        "factors": factors,
        "primary_risk_drivers": primary_risk_drivers,
    }
