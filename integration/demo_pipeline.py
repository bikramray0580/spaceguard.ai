"""Run the SpaceGuard A -> B -> C pipeline with live-first data refresh.

Run from the project root with:
    python -m integration.demo_pipeline

The demo checks the CelesTrak refresh window, downloads fresh orbital data
when the saved snapshot is stale, and falls back to the latest validated
snapshot if the network is unavailable.
"""

import argparse
from pathlib import Path

from data_engine.ingest_tle import refresh_snapshot

from .pipeline import load_orbital_data, run_pipeline
from .reporting import render_debug_report, render_safety_report


DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "orbital_data.json"
OBJECT_LIMIT = 100


def main() -> None:
    """Run a bounded real-data analysis after refreshing orbital data."""
    parser = argparse.ArgumentParser(
        description="Run the SpaceGuard A -> B -> C demo with current CelesTrak data."
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="show the compact diagnostic output instead of the safety report",
    )
    parser.add_argument(
        "--offline",
        action="store_true",
        help="skip CelesTrak and use the latest saved orbital_data.json snapshot",
    )
    parser.add_argument(
        "--force-refresh",
        action="store_true",
        help="explicitly attempt a CelesTrak refresh even when the snapshot is under 2 hours old",
    )
    args = parser.parse_args()

    if args.offline:
        print("Offline mode: using the latest saved orbital_data.json snapshot.")
    else:
        refresh_snapshot(force=args.force_refresh)

    snapshot = load_orbital_data(DATA_PATH)
    available_objects = len(snapshot.objects)
    max_objects = min(OBJECT_LIMIT, available_objects)

    print(f"Objects available for analysis: {available_objects}")
    print(f"Objects selected for analysis: {max_objects}")

    run = run_pipeline(
        DATA_PATH,
        start_time=snapshot.fetched_at,
        duration_minutes=30,
        step_seconds=300,
        max_objects=max_objects,
    )
    report = render_debug_report(run) if args.debug else render_safety_report(run)
    print(report)


if __name__ == "__main__":
    main()
