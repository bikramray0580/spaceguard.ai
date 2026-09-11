"""Run the SpaceGuard pipeline using the latest persistent orbital records.

Run from the project root with:
    python -m integration.demo_pipeline

The demo first attempts a CelesTrak refresh. Regardless of whether that
network request succeeds, the integration analysis reads the newest validated
TLE records from SQLite. JSON remains available as an explicit offline
fallback when the database has no records.
"""

import argparse
from pathlib import Path

from data_engine.ingest_tle import refresh_snapshot

from .pipeline import (
    load_orbital_data,
    run_pipeline,
    run_pipeline_from_database,
)
from .reporting import render_debug_report, render_safety_report


DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "orbital_data.json"
OBJECT_LIMIT = 100


def main() -> None:
    """Run a bounded real-data analysis from the latest database records."""
    parser = argparse.ArgumentParser(
        description="Run the SpaceGuard A -> B -> C demo with current orbital data."
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="show the compact diagnostic output instead of the safety report",
    )
    parser.add_argument(
        "--offline",
        action="store_true",
        help="skip CelesTrak and use the latest available database records",
    )
    parser.add_argument(
        "--force-refresh",
        action="store_true",
        help="explicitly attempt a CelesTrak refresh even when the snapshot is under 2 hours old",
    )
    args = parser.parse_args()

    if args.offline:
        print("Offline mode: skipping CelesTrak refresh and using the latest database records.")
    else:
        refresh_snapshot(force=args.force_refresh)

    try:
        from data_engine.database import get_latest_orbital_data

        database_rows = get_latest_orbital_data()
    except Exception as error:
        database_rows = []
        print(f"Database read failed: {error}")

    if database_rows:
        available_objects = len(database_rows)
        max_objects = min(OBJECT_LIMIT, available_objects)
        print(f"Orbital source: SQLite latest records ({available_objects} objects)")
        print(f"Objects selected for analysis: {max_objects}")
        run = run_pipeline_from_database(
            duration_minutes=30,
            step_seconds=300,
            max_objects=max_objects,
        )
    else:
        print("SQLite has no orbital records; falling back to orbital_data.json.")
        snapshot = load_orbital_data(DATA_PATH)
        available_objects = len(snapshot.objects)
        max_objects = min(OBJECT_LIMIT, available_objects)
        print(f"Orbital source: JSON snapshot ({available_objects} objects)")
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
