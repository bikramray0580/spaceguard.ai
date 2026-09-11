"""Tests for structured, physics-based conjunction explanations."""

from datetime import timedelta
import unittest

from collision_engine import (
    build_risk_explanation,
    explain_miss_distance,
    explain_relative_velocity,
    explain_time_to_tca,
)


class RiskExplanationTests(unittest.TestCase):
    def test_high_risk_explanation_is_physics_first(self) -> None:
        explanation = build_risk_explanation("HIGH", 0.8, 12.0, timedelta(minutes=15))

        self.assertIn("HIGH collision risk", explanation["summary"])
        self.assertEqual(explanation["factors"][0]["severity"], "VERY HIGH")
        self.assertEqual(explanation["factors"][1]["severity"], "HIGH")
        self.assertEqual(explanation["factors"][2]["severity"], "IMMINENT")
        self.assertEqual(
            explanation["primary_risk_drivers"],
            ["Miss Distance", "Relative Velocity"],
        )
        self.assertEqual(explanation["urgency"], "HIGH")
        self.assertIn("Immediate operator review", explanation["operator_action"])

    def test_low_risk_does_not_promote_velocity_or_tca_to_risk_drivers(self) -> None:
        explanation = build_risk_explanation("LOW", 40000.0, 14.0, timedelta(minutes=30))

        self.assertEqual(explanation["primary_risk_drivers"], [])
        self.assertEqual(explanation["urgency"], "HIGH")
        self.assertIn("collision risk is LOW", explanation["operator_action"])
        self.assertIn("does not override the large predicted separation", explanation["summary"])

    def test_medium_and_low_risk_explanations_are_structured(self) -> None:
        medium = build_risk_explanation("MEDIUM", 5.0, 3.0, timedelta(days=2))
        low = build_risk_explanation("LOW", 20.0, 3.0, timedelta(days=2))

        self.assertEqual(medium["factors"][0]["severity"], "HIGH")
        self.assertEqual(medium["primary_risk_drivers"], ["Miss Distance"])
        self.assertEqual(low["factors"][0]["severity"], "LOW")
        self.assertEqual(low["primary_risk_drivers"], [])
        self.assertEqual(low["urgency"], "LOW")

    def test_individual_physical_factor_warnings(self) -> None:
        self.assertEqual(explain_miss_distance(0.1)["severity"], "VERY HIGH")
        velocity = explain_relative_velocity(12.0)
        self.assertEqual(velocity["severity"], "HIGH")
        self.assertIn("relative encounter speed is high", velocity["reason"])
        self.assertIn("does not independently determine collision risk", velocity["reason"])

    def test_missing_time_to_tca_is_safe_and_explicit(self) -> None:
        factor = explain_time_to_tca(None)
        explanation = build_risk_explanation("LOW", 20.0, 3.0, None)

        self.assertEqual(factor["severity"], "UNAVAILABLE")
        self.assertEqual(explanation["factors"][2]["value"], "Unavailable")
        self.assertEqual(explanation["urgency"], "UNKNOWN")


if __name__ == "__main__":
    unittest.main()
