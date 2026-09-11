"""Data models for sampled conjunction analysis."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from math import isfinite
from typing import Any


@dataclass(frozen=True)
class Vector3:
    """A three-dimensional vector whose units are defined by its owner."""

    x: float
    y: float
    z: float

    def __post_init__(self) -> None:
        for axis, value in (("x", self.x), ("y", self.y), ("z", self.z)):
            if not isinstance(value, (int, float)) or isinstance(value, bool) or not isfinite(value):
                raise ValueError(f"{axis} must be a finite numeric value")


@dataclass(frozen=True)
class OrbitalState:
    """One propagated state vector: kilometres, kilometres/second, and a frame."""

    object_id: str
    timestamp: datetime
    position_km: Vector3
    velocity_km_s: Vector3
    coordinate_frame: str

    def __post_init__(self) -> None:
        if not isinstance(self.object_id, str) or not self.object_id.strip():
            raise ValueError("object_id must be a non-empty string")
        if not isinstance(self.timestamp, datetime):
            raise TypeError("timestamp must be a datetime")
        if self.timestamp.tzinfo is None or self.timestamp.utcoffset() is None:
            raise ValueError("timestamp must be timezone-aware")
        if not isinstance(self.coordinate_frame, str) or not self.coordinate_frame.strip():
            raise ValueError("coordinate_frame must be a non-empty string")

    @classmethod
    def from_propagation_result(cls, result: Any) -> "OrbitalState":
        """Adapt an ``orbit_engine.PropagationResult`` without re-propagating it."""
        try:
            return cls(
                object_id=result.object_id,
                timestamp=result.timestamp,
                position_km=Vector3(
                    result.position.x_km, result.position.y_km, result.position.z_km
                ),
                velocity_km_s=Vector3(
                    result.velocity.x_km_s,
                    result.velocity.y_km_s,
                    result.velocity.z_km_s,
                ),
                coordinate_frame=result.coordinate_frame,
            )
        except AttributeError as error:
            raise TypeError(
                "result must provide the orbit_engine PropagationResult state-vector fields"
            ) from error


@dataclass(frozen=True)
class ConjunctionEvent:
    """The closest sampled approach found between two objects."""

    object_a: str
    object_b: str
    time_of_closest_approach: datetime
    miss_distance_km: float
    relative_velocity_km_s: float
    risk_level: str
    risk_reason: str
    risk_explanation: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-serializable event representation."""
        data = asdict(self)
        data["time_of_closest_approach"] = (
            self.time_of_closest_approach.astimezone(timezone.utc)
            .isoformat()
            .replace("+00:00", "Z")
        )
        return data
