"""Run the SpaceGuard A -> B -> C pipeline with live-first data refresh.

Run from the project root with:
    python -m integration.demo_pipeline

The demo first attempts to refresh the latest TLEs from CelesTrak. If the
network refresh fails, data_engine keeps the latest validated snapshot and the
pipeline continues offline.
"""

import argparse
from pathlib import Path

from data_engine.ingest_tle import refresh_snapshot

from .pipeline import load_orbital_data, run_pipeline
from .reporting import render_debug_report, render_safety_report


DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "orbital_data.json"


def main() -> None:
    """Run a bounded real-data analysis after refreshing orbital data."""
    parser = argparse.ArgumentParser(
        description="Run the SpaceGuard A -> B -> C demo with live-first data."
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
    args = parser.parse_args()

    if args.offline:
        print("Offline mode: using the latest saved orbital_data.json snapshot.")
    else:
        refresh_snapshot()

    snapshot = load_orbital_data(DATA_PATH)
    run = run_pipeline(
        DATA_PATH,
        start_time=snapshot.fetched_at,
        duration_minutes=30,
        step_seconds=300,
        max_objects=10,
    )
    report = render_debug_report(run) if args.debug else render_safety_report(run)
    print(report)


if __name__ == "__main__":
    main()
