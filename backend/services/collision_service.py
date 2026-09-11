"""Conjunction screening service wrapping orbit_engine and collision_engine."""
 
from datetime import datetime
 
from collision_engine import OrbitalState, find_closest_approach
from orbit_engine import generate_time_steps, propagate_tle
 
from ..models.object import SpaceObject
from .ml_service import predict_event_risk
 
 
def screen_conjunction(
    object_a: SpaceObject,
    object_b: SpaceObject,
    start: datetime,
    end: datetime,
    step_minutes: float,
) -> dict:
    """Screen two objects over one shared time grid and return the event.
 
    The collision-engine deterministic risk is preserved and the ML prediction
    is returned alongside it; the ML result never replaces ``risk_level``.
    """
    timestamps = generate_time_steps(start, end, step_minutes)
    results_a = propagate_tle(object_a.name, object_a.line1, object_a.line2, timestamps)
    results_b = propagate_tle(object_b.name, object_b.line1, object_b.line2, timestamps)
    states_a = [OrbitalState.from_propagation_result(result) for result in results_a]
    states_b = [OrbitalState.from_propagation_result(result) for result in results_b]
    event = find_closest_approach(states_a, states_b, analysis_time=timestamps[0])
    data = event.to_dict()
    data["object_a"] = object_a.object_id
    data["object_b"] = object_b.object_id
    data["ml_prediction"] = predict_event_risk(
        event, states_a, states_b, analysis_time=timestamps[0]
    )
    return data
