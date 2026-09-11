"""Sampled, deterministic conjunction detection for propagated orbital states."""

from .conjunction import find_closest_approach
from .distance import (
    relative_position_km,
    relative_velocity_km_s,
    relative_velocity_magnitude_km_s,
    separation_distance_km,
)
from .models import ConjunctionEvent, OrbitalState, Vector3
from .risk import HIGH_MISS_DISTANCE_KM, MEDIUM_MISS_DISTANCE_KM, classify_risk
from .risk_explanation import build_risk_explanation, explain_miss_distance, explain_relative_velocity, explain_time_to_tca

__all__ = [
    "ConjunctionEvent",
    "HIGH_MISS_DISTANCE_KM",
    "MEDIUM_MISS_DISTANCE_KM",
    "OrbitalState",
    "Vector3",
    "classify_risk",
    "build_risk_explanation",
    "explain_miss_distance",
    "explain_relative_velocity",
    "explain_time_to_tca",
    "find_closest_approach",
    "relative_position_km",
    "relative_velocity_km_s",
    "relative_velocity_magnitude_km_s",
    "separation_distance_km",
]
