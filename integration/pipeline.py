"""Validated orchestration from orbital data through propagation and conjunction analysis."""

from __future__ import annotations

import json
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from itertools import combinations
from pathlib import Path
from typing import Any, Iterable

from collision_engine import OrbitalState, find_closest_approach
from data_engine.database import create_tables, get_latest_orbital_data
from orbit_engine import propagate_tle
from orbit_engine.models import PropagationResult

from .models import LoadedOrbitalData, PipelineRun, SatelliteTLE


def _parse_utc_timestamp(value: Any, field_name: str) -> datetime:
    """Parse a required ISO-8601 timestamp and normalize it to UTC."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field_name} must be a non-empty ISO-8601 timestamp string")
    try:
        timestamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError(f"{field_name} must be a valid ISO-8601 timestamp") from error
    if timestamp.tzinfo is None or timestamp.utcoffset() is None:
        raise ValueError(f"{field_name} must include a timezone")
    return timestamp.astimezone(timezone.utc)


def _required_string(record: dict[str, Any], field_name: str, context: str) -> str:
    value = record.get(field_name)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{context}.{field_name} must be a non-empty string")
    return value


def load_orbital_data(orbital_data_path: str | Path) -> LoadedOrbitalData:
    """Load and validate an orbital-data JSON snapshot."""
    path = Path(orbital_data_path)
    try:
        with path.open(encoding="utf-8") as file:
            payload = json.load(file)
    except FileNotFoundError as error:
        raise FileNotFoundError(f"orbital data file was not found: {path}") from error
    except json.JSONDecodeError as error:
        raise ValueError(f"orbital data file is not valid JSON: {path}") from error

    if not isinstance(payload, dict):
        raise ValueError("orbital data must be a JSON object")
    source = _required_string(payload, "source", "orbital data")
    fetched_at = _parse_utc_timestamp(payload.get("fetched_at"), "fetched_at")
    raw_objects = payload.get("objects")
    if not isinstance(raw_objects, list) or not raw_objects:
        raise ValueError("orbital data.objects must be a non-empty list")

    objects: list[SatelliteTLE] = []
    object_ids: set[str] = set()
    for index, raw_object in enumerate(raw_objects):
        context = f"objects[{index}]"
        if not isinstance(raw_object, dict):
            raise ValueError(f"{context} must be an object")
        object_id = _required_string(raw_object, "object_id", context)
        if object_id in object_ids:
            raise ValueError(f"duplicate object_id in orbital data: {object_id}")
        name = _required_string(raw_object, "name", context)
        raw_tle = raw_object.get("tle")
        if not isinstance(raw_tle, dict):
            raise ValueError(f"{context}.tle must be an object")
        line1 = _required_string(raw_tle, "line1", f"{context}.tle")
        line2 = _required_string(raw_tle, "line2", f"{context}.tle")
        if not line1.startswith("1 ") or not line2.startswith("2 "):
            raise ValueError(f"{context}.tle must contain TLE line 1 and line 2")
        if line1[2:7].strip() != object_id or line2[2:7].strip() != object_id:
            raise ValueError(f"{context}.object_id must match both TLE catalog IDs")
        epoch = _parse_utc_timestamp(raw_object.get("epoch"), f"{context}.epoch")
        objects.append(SatelliteTLE(object_id, name, line1, line2, epoch))
        object_ids.add(object_id)

    return LoadedOrbitalData(source, fetched_at, tuple(objects))


def load_orbital_data_from_database() -> LoadedOrbitalData:
    """Load the newest stored TLE record for every object from SQLite.

    SQLite is the primary source for integration because the ingestion/scheduler
    persists every validated CelesTrak fetch there. The JSON snapshot remains a
    separate fallback for offline operation.
    """
    create_tables()
    rows = get_latest_orbital_data()
    if not rows:
        raise ValueError("SpaceGuard database contains no orbital records")

    objects: list[SatelliteTLE] = []
    fetched_times: list[datetime] = []
    object_ids: set[str] = set()
    for index, row in enumerate(rows):
        if len(row) != 7:
            raise ValueError(f"database orbital row {index} has an unexpected shape")
        object_id, name, line1, line2, epoch, source, fetched_at = row
        if not all(isinstance(value, str) and value.strip() for value in row):
            raise ValueError(f"database orbital row {index} contains an invalid value")
        if object_id in object_ids:
            raise ValueError(f"duplicate object_id in database latest records: {object_id}")
        if not line1.startswith("1 ") or not line2.startswith("2 "):
            raise ValueError(f"database orbital row {index} contains invalid TLE lines")
        if line1[2:7].strip() != object_id or line2[2:7].strip() != object_id:
            raise ValueError(f"database orbital row {index} has mismatched catalog IDs")

        objects.append(
            SatelliteTLE(
                object_id=object_id,
                name=name,
                line1=line1,
                line2=line2,
                epoch=_parse_utc_timestamp(epoch, f"database row {index}.epoch"),
            )
        )
        fetched_times.append(_parse_utc_timestamp(fetched_at, f"database row {index}.fetched_at"))
        object_ids.add(object_id)

    source = "CelesTrak"
    unique_sources = {row[5] for row in rows}
    if len(unique_sources) == 1:
        source = next(iter(unique_sources))
    return LoadedOrbitalData(source, max(fetched_times), tuple(objects))


def generate_shared_timestamps(
    start_time: datetime, duration_minutes: float, step_seconds: float
) -> tuple[datetime, ...]:
    """Generate one inclusive UTC sample grid shared by every propagated object."""
    if not isinstance(start_time, datetime):
        raise TypeError("start_time must be a datetime")
    if start_time.tzinfo is None or start_time.utcoffset() is None:
        raise ValueError("start_time must be timezone-aware")
    if isinstance(duration_minutes, bool) or not isinstance(duration_minutes, (int, float)):
        raise ValueError("duration_minutes must be a positive number")
    if isinstance(step_seconds, bool) or not isinstance(step_seconds, (int, float)):
        raise ValueError("step_seconds must be a positive number")
    if duration_minutes <= 0 or step_seconds <= 0:
        raise ValueError("duration_minutes and step_seconds must be positive")

    start = start_time.astimezone(timezone.utc)
    duration = timedelta(minutes=duration_minutes)
    step = timedelta(seconds=step_seconds)
    end = start + duration
    timestamps = [start]
    current = start
    while current + step <= end:
        current += step
        timestamps.append(current)
    if timestamps[-1] != end:
        raise ValueError("duration_minutes must be an exact multiple of step_seconds")
    return tuple(timestamps)


def _select_objects(
    objects: tuple[SatelliteTLE, ...], max_objects: int, object_ids: Iterable[str] | None
) -> tuple[SatelliteTLE, ...]:
    if isinstance(max_objects, bool) or not isinstance(max_objects, int) or max_objects <= 0:
        raise ValueError("max_objects must be a positive integer")
    if object_ids is None:
        selected = objects[:max_objects]
    else:
        requested_ids = tuple(object_ids)
        if not requested_ids:
            raise ValueError("object_ids cannot be empty when provided")
        if len(set(requested_ids)) != len(requested_ids):
            raise ValueError("object_ids cannot contain duplicates")
        objects_by_id = {object_.object_id: object_ for object_ in objects}
        missing_ids = [object_id for object_id in requested_ids if object_id not in objects_by_id]
        if missing_ids:
            raise ValueError(f"requested object_ids are missing from orbital data: {missing_ids}")
        selected = tuple(objects_by_id[object_id] for object_id in requested_ids[:max_objects])
    if len(selected) < 2:
        raise ValueError("at least two objects must be selected for conjunction analysis")
    return tuple(selected)


def _propagate_object(
    object_: SatelliteTLE, timestamps: tuple[datetime, ...]
) -> tuple[PropagationResult, ...]:
    """Propagate one source object and preserve its padded source NORAD ID."""
    results = propagate_tle(object_.name, object_.line1, object_.line2, timestamps)
    if not isinstance(results, list) or len(results) != len(timestamps):
        raise RuntimeError("orbit_engine returned an unexpected propagation result series")

    normalized_results: list[PropagationResult] = []
    for result, timestamp in zip(results, timestamps):
        if not isinstance(result, PropagationResult):
            raise RuntimeError("orbit_engine returned a value that is not a PropagationResult")
        if result.timestamp != timestamp:
            raise RuntimeError("orbit_engine returned a result with an unexpected timestamp")
        normalized_results.append(replace(result, object_id=object_.object_id))
    return tuple(normalized_results)


def run_pipeline(
    orbital_data_path: str | Path,
    start_time: datetime,
    duration_minutes: float,
    step_seconds: float,
    *,
    max_objects: int = 10,
    object_ids: Iterable[str] | None = None,
) -> PipelineRun:
    """Run a supplied orbital-data source through propagation and conjunction analysis."""
    loaded_data = load_orbital_data(orbital_data_path)
    return _run_loaded_pipeline(
        loaded_data, start_time, duration_minutes, step_seconds, max_objects=max_objects, object_ids=object_ids
    )


def run_pipeline_from_database(
    duration_minutes: float,
    step_seconds: float,
    *,
    max_objects: int = 10,
    object_ids: Iterable[str] | None = None,
) -> PipelineRun:
    """Run the integration pipeline using the newest records stored in SQLite."""
    loaded_data = load_orbital_data_from_database()
    # Use the newest ingestion timestamp as the common analysis start time.
    return _run_loaded_pipeline(
        loaded_data,
        loaded_data.fetched_at,
        duration_minutes,
        step_seconds,
        max_objects=max_objects,
        object_ids=object_ids,
    )


def _run_loaded_pipeline(
    loaded_data: LoadedOrbitalData,
    start_time: datetime,
    duration_minutes: float,
    step_seconds: float,
    *,
    max_objects: int,
    object_ids: Iterable[str] | None,
) -> PipelineRun:
    selected_objects = _select_objects(loaded_data.objects, max_objects, object_ids)
    timestamps = generate_shared_timestamps(start_time, duration_minutes, step_seconds)

    propagated_by_object: dict[str, tuple[PropagationResult, ...]] = {}
    states_by_object: dict[str, tuple[OrbitalState, ...]] = {}
    for object_ in selected_objects:
        propagation_results = _propagate_object(object_, timestamps)
        propagated_by_object[object_.object_id] = propagation_results
        states_by_object[object_.object_id] = tuple(
            OrbitalState.from_propagation_result(result) for result in propagation_results
        )

    conjunctions = tuple(
        find_closest_approach(states_by_object[first_id], states_by_object[second_id])
        for first_id, second_id in combinations(states_by_object, 2)
    )
    return PipelineRun(
        source=loaded_data.source,
        fetched_at=loaded_data.fetched_at,
        timestamps=timestamps,
        propagated_by_object=propagated_by_object,
        states_by_object=states_by_object,
        conjunctions=conjunctions,
    )
