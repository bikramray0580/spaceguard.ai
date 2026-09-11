"""Tests for deterministic sampled closest-approach search."""

from datetime import datetime, timedelta, timezone
import unittest

from collision_engine import OrbitalState, Vector3, find_closest_approach

TIME = datetime(2026, 8, 22, 12, 0, tzinfo=timezone.utc)


def make_state(object_id: str, minute: int, x_km: float, *, frame: str = "TEME") -> OrbitalState:
    return OrbitalState(
        object_id, TIME + timedelta(minutes=minute), Vector3(x_km, 0, 0), Vector3(0, 7, 0), frame
    )


class ConjunctionTests(unittest.TestCase):
    def test_closest_approach_in_middle(self) -> None:
        a = [make_state("A", minute, 0) for minute in range(3)]
        b = [make_state("B", 0, 8), make_state("B", 1, 0.5), make_state("B", 2, 4)]
        event = find_closest_approach(a, b)
        self.assertEqual(event.time_of_closest_approach, TIME + timedelta(minutes=1))
        self.assertEqual(event.miss_distance_km, 0.5)
        self.assertEqual(event.risk_level, "HIGH")
        self.assertEqual(event.risk_explanation["factors"][0]["severity"], "VERY HIGH")
        self.assertEqual(event.risk_explanation["factors"][2]["value"], "1 min")

    def test_closest_approach_at_beginning_and_end(self) -> None:
        a = [make_state("A", minute, 0) for minute in range(3)]
        beginning = [make_state("B", 0, 0.5), make_state("B", 1, 2), make_state("B", 2, 3)]
        ending = [make_state("B", 0, 3), make_state("B", 1, 2), make_state("B", 2, 0.5)]
        self.assertEqual(find_closest_approach(a, beginning).time_of_closest_approach, TIME)
        self.assertEqual(find_closest_approach(a, ending).time_of_closest_approach, TIME + timedelta(minutes=2))

    def test_empty_series_and_identical_ids_are_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "cannot be empty"):
            find_closest_approach([], [])
        states = [make_state("A", 0, 0)]
        with self.assertRaisesRegex(ValueError, "different object_ids"):
            find_closest_approach(states, [make_state("A", 0, 1)])

    def test_mismatched_series_timestamps_are_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "same timestamp"):
            find_closest_approach([make_state("A", 0, 0)], [make_state("B", 1, 1)])

    def test_invalid_object_id_is_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "object_id"):
            make_state("", 0, 0)
