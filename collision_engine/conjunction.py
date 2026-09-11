"""Sampled closest-approach search for two propagated state time series."""

from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime

from .distance import relative_velocity_magnitude_km_s, separation_distance_km
from .models import ConjunctionEvent, OrbitalState
from .risk import classify_risk
from .risk_explanation import build_risk_explanation


def _validate_series(states: Sequence[OrbitalState], label: str) -> None:
    if not states:
        raise ValueError(f"{label} state series cannot be empty")
    object_id = states[0].object_id
    frame = states[0].coordinate_frame
    previous_timestamp = None
    for state in states:
        if state.object_id != object_id:
            raise ValueError(f"{label} states must all have the same object_id")
        if state.coordinate_frame != frame:
            raise ValueError(f"{label} states must all have the same coordinate frame")
        if previous_timestamp is not None and state.timestamp <= previous_timestamp:
            raise ValueError(f"{label} timestamps must be strictly increasing")
        previous_timestamp = state.timestamp


def find_closest_approach(
    states_a: Sequence[OrbitalState],
    states_b: Sequence[OrbitalState],
    *,
    analysis_time: datetime | None = None,
) -> ConjunctionEvent:
    """Find the smallest separation among matching, sampled future states.

    Each series must contain samples for exactly the same, strictly increasing
    timestamps in the same coordinate frame. The method reports the closest
    *sampled* approach; it does not interpolate between samples. ``analysis_time``
    supplies the reference for time-to-TCA; when omitted, the first sample is
    used as the shared-grid analysis start.
    """
    _validate_series(states_a, "object A")
    _validate_series(states_b, "object B")
    if states_a[0].object_id == states_b[0].object_id:
        raise ValueError("object A and object B must have different object_ids")
    if len(states_a) != len(states_b):
        raise ValueError("object A and object B must have the same number of states")

    closest_a: OrbitalState | None = None
    closest_b: OrbitalState | None = None
    minimum_distance: float | None = None
    for state_a, state_b in zip(states_a, states_b):
        distance = separation_distance_km(state_a, state_b)
        if minimum_distance is None or distance < minimum_distance:
            closest_a, closest_b, minimum_distance = state_a, state_b, distance

    assert closest_a is not None and closest_b is not None and minimum_distance is not None
    if analysis_time is None:
        # The first shared sample is the pipeline's reliable analysis start.
        analysis_time = states_a[0].timestamp
    if not isinstance(analysis_time, datetime):
        raise TypeError("analysis_time must be a datetime or None")
    if analysis_time.tzinfo is None or analysis_time.utcoffset() is None:
        raise ValueError("analysis_time must be timezone-aware")

    relative_velocity = relative_velocity_magnitude_km_s(closest_a, closest_b)
    risk_level = classify_risk(minimum_distance)
    risk_explanation = build_risk_explanation(
        risk_level,
        minimum_distance,
        relative_velocity,
        closest_a.timestamp - analysis_time,
    )
    return ConjunctionEvent(
        object_a=closest_a.object_id,
        object_b=closest_b.object_id,
        time_of_closest_approach=closest_a.timestamp,
        miss_distance_km=minimum_distance,
        relative_velocity_km_s=relative_velocity,
        risk_level=risk_level,
        # Retain the legacy string field for existing callers.
        risk_reason=risk_explanation["summary"],
        risk_explanation=risk_explanation,
    )
