"""Physics-based, operator-oriented explanations for conjunction events.

The risk classification remains authoritative from ``collision_engine.risk``.
This module explains *why* that classification was produced and separately
reports encounter severity and operational urgency.  The thresholds here are
configurable project demonstration/engineering thresholds; they are not
official collision-probability standards.
"""

from __future__ import annotations

from datetime import timedelta
from math import isfinite
from typing import Any

from .risk import HIGH_MISS_DISTANCE_KM, MEDIUM_MISS_DISTANCE_KM


# These are contextual thresholds only. They do not change the collision-risk
# classification, which remains based on the project's miss-distance rules.
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
    return {
        "name": name,
        "value": value,
        "severity": severity,
        "reason": reason,
    }


def explain_miss_distance(miss_distance_km: float) -> dict[str, str]:
    """Explain collision significance of the predicted miss distance."""
    distance = _require_non_negative_number(miss_distance_km, "miss_distance_km")

    if distance <= HIGH_MISS_DISTANCE_KM:
        return _factor(
            "Miss Distance",
            f"{distance:.3f} km",
            "VERY HIGH",
            "The predicted separation is at or below the project's configured high-risk demonstration threshold.",
        )

    if distance <= MEDIUM_MISS_DISTANCE_KM:
        return _factor(
            "Miss Distance",
            f"{distance:.3f} km",
            "HIGH",
            "The predicted separation is within the project's configured elevated-risk demonstration range.",
        )

    return _factor(
        "Miss Distance",
        f"{distance:.3f} km",
        "LOW",
        "The predicted separation is above the project's configured collision-risk thresholds.",
    )


def explain_relative_velocity(relative_velocity_km_s: float) -> dict[str, str]:
    """Explain encounter speed as a severity/context indicator.

    Relative velocity does not independently raise the collision-risk level.
    A high speed matters most when the predicted separation is already close.
    """
    velocity = _require_non_negative_number(
        relative_velocity_km_s, "relative_velocity_km_s"
    )

    if velocity >= HIGH_RELATIVE_VELOCITY_KM_S:
        severity = "HIGH"
        reason = (
            "The relative encounter speed is high and would increase the severity "
            "of an otherwise close approach. It does not independently determine collision risk."
        )
    elif velocity >= ELEVATED_RELATIVE_VELOCITY_KM_S:
        severity = "ELEVATED"
        reason = (
            "The relative encounter speed is elevated. This becomes more significant "
            "if the predicted separation is also small."
        )
    else:
        severity = "LOW"
        reason = "The relative encounter speed is comparatively low and is not a primary risk driver."

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
    """Explain TCA as operational urgency, not collision severity."""
    if time_to_tca is None:
        return _factor(
            "Time to TCA",
            "Unavailable",
            "UNAVAILABLE",
            "No analysis reference time was supplied, so remaining response time cannot be determined.",
        )

    if not isinstance(time_to_tca, timedelta):
        raise TypeError("time_to_tca must be a timedelta or None")

    hours = time_to_tca.total_seconds() / 3600
    if hours <= 0:
        severity = "IMMINENT"
        reason = "The closest approach is occurring now or has already passed the analysis reference time."
    elif hours <= IMMINENT_TCA_HOURS:
        severity = "IMMINENT"
        reason = "The closest approach is within the next hour, leaving limited time for operator assessment."
    elif hours <= ELEVATED_TCA_HOURS:
        severity = "ELEVATED"
        reason = "The closest approach is within the next 24 hours and should remain under observation."
    else:
        severity = "LOW"
        reason = "The closest approach is outside the near-term response window."

    return _factor("Time to TCA", _format_time_to_tca(time_to_tca), severity, reason)


def _build_summary(
    risk_level: str,
    miss_distance_km: float,
    relative_velocity_km_s: float,
    time_to_tca: timedelta | None,
) -> str:
    """Create a concise operator-facing assessment tied to the physics."""
    distance = float(miss_distance_km)
    velocity = float(relative_velocity_km_s)

    if risk_level == "HIGH":
        summary = (
            f"HIGH collision risk: the predicted miss distance is {distance:.3f} km, "
            "which falls within the project's high-risk demonstration range."
        )
        if velocity >= HIGH_RELATIVE_VELOCITY_KM_S:
            summary += " The encounter also has a high relative velocity, increasing the potential severity of a close encounter."
        elif velocity >= ELEVATED_RELATIVE_VELOCITY_KM_S:
            summary += " The encounter has an elevated relative velocity, adding to encounter severity."
        return summary

    if risk_level == "MEDIUM":
        summary = (
            f"MEDIUM collision risk: the predicted miss distance is {distance:.3f} km, "
            "within the project's configured elevated-risk demonstration range."
        )
        if velocity >= HIGH_RELATIVE_VELOCITY_KM_S:
            summary += " The high relative velocity increases the potential severity of this close approach."
        elif velocity >= ELEVATED_RELATIVE_VELOCITY_KM_S:
            summary += " The elevated relative velocity adds encounter severity."
        return summary

    summary = (
        f"LOW collision risk: the predicted miss distance is {distance:.3f} km, "
        "above the project's configured collision-risk thresholds."
    )
    if velocity >= HIGH_RELATIVE_VELOCITY_KM_S:
        summary += " Relative velocity is high, but it does not override the large predicted separation."
    elif velocity >= ELEVATED_RELATIVE_VELOCITY_KM_S:
        summary += " Relative velocity is elevated, but the predicted separation remains the dominant risk consideration."
    else:
        summary += " The encounter speed does not add a significant severity concern."
    return summary


def _build_operator_assessment(
    risk_level: str,
    miss_distance_km: float,
    relative_velocity_km_s: float,
    time_to_tca: timedelta | None,
) -> tuple[str, str]:
    """Return separate operational urgency and recommended review level."""
    distance = float(miss_distance_km)
    velocity = float(relative_velocity_km_s)

    if time_to_tca is None:
        urgency = "UNKNOWN"
    else:
        hours = time_to_tca.total_seconds() / 3600
        if hours <= 0:
            urgency = "IMMEDIATE"
        elif hours <= IMMINENT_TCA_HOURS:
            urgency = "HIGH"
        elif hours <= ELEVATED_TCA_HOURS:
            urgency = "ELEVATED"
        else:
            urgency = "LOW"

    if risk_level == "HIGH":
        action = "Immediate operator review recommended. Evaluate the event and any available mitigation options."
    elif risk_level == "MEDIUM":
        action = "Prioritize operator review and continue monitoring the conjunction as TCA approaches."
    elif urgency in {"IMMEDIATE", "HIGH"} and distance > MEDIUM_MISS_DISTANCE_KM:
        if velocity >= HIGH_RELATIVE_VELOCITY_KM_S:
            action = "Monitor closely: collision risk is LOW, but the encounter is time-critical and has high relative velocity."
        else:
            action = "Monitor the event: collision risk is LOW, while the approaching TCA warrants continued observation."
    else:
        action = "Routine monitoring recommended; no immediate collision response is indicated by the current geometry."

    return urgency, action


def build_risk_explanation(
    risk_level: str,
    miss_distance_km: float,
    relative_velocity_km_s: float,
    time_to_tca: timedelta | None = None,
) -> dict[str, Any]:
    """Build a professional, API-ready conjunction risk explanation.

    ``risk_level`` remains the output of the existing miss-distance classifier.
    Relative velocity provides encounter-severity context, while TCA provides
    operational urgency. Neither is allowed to silently recalculate risk.
    """
    if risk_level not in {"HIGH", "MEDIUM", "LOW"}:
        raise ValueError("risk_level must be HIGH, MEDIUM, or LOW")

    miss_factor = explain_miss_distance(miss_distance_km)
    velocity_factor = explain_relative_velocity(relative_velocity_km_s)
    tca_factor = explain_time_to_tca(time_to_tca)
    factors = [miss_factor, velocity_factor, tca_factor]

    # Collision-risk drivers are deliberately separated from urgency. Miss
    # distance is the authoritative risk driver; velocity is supporting
    # context when the encounter is close; TCA belongs to urgency only.
    primary_risk_drivers: list[str] = []
    if risk_level in {"HIGH", "MEDIUM"}:
        primary_risk_drivers.append("Miss Distance")
        if float(relative_velocity_km_s) >= ELEVATED_RELATIVE_VELOCITY_KM_S:
            primary_risk_drivers.append("Relative Velocity")

    urgency, operator_action = _build_operator_assessment(
        risk_level,
        miss_distance_km,
        relative_velocity_km_s,
        time_to_tca,
    )

    summary = _build_summary(
        risk_level,
        miss_distance_km,
        relative_velocity_km_s,
        time_to_tca,
    )

    return {
        "summary": summary,
        "factors": factors,
        "primary_risk_drivers": primary_risk_drivers,
        "urgency": urgency,
        "operator_action": operator_action,
    }
