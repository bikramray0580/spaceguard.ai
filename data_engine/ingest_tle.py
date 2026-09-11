# imported necessary libraries for data ingestion
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .validation import validate_tle_pair
from .database import create_tables, insert_orbital_object

CELESTRAK_URL = (
    "https://celestrak.org/NORAD/elements/"
    "gp.php?GROUP=active&FORMAT=tle"
)

OUTPUT_FILE = Path(__file__).resolve().parent.parent / "data" / "orbital_data.json"
OBJECT_LIMIT = 100
# CelesTrak GP data is updated on a roughly two-hour cadence. Do not request
# the same dataset more often than necessary.
REFRESH_INTERVAL = timedelta(hours=2)
REQUEST_TIMEOUT_SECONDS = 30


def _utc_now():
    return datetime.now(timezone.utc)


def _parse_iso_datetime(value):
    """Parse an ISO UTC timestamp stored in the local snapshot."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def snapshot_age():
    """Return the age of the saved snapshot, or None if it is unavailable."""
    if not OUTPUT_FILE.exists():
        return None

    try:
        with open(OUTPUT_FILE, "r", encoding="utf-8") as file:
            snapshot = json.load(file)
        fetched_at = _parse_iso_datetime(snapshot.get("fetched_at"))
        if fetched_at is None:
            return None
        return max(_utc_now() - fetched_at, timedelta(0))
    except (OSError, json.JSONDecodeError):
        return None


def fetch_tle_data():
    """Fetch the latest TLE data from CelesTrak."""
    request = Request(
        CELESTRAK_URL,
        headers={
            "User-Agent": "SpaceGuardAI/1.0",
            "Accept": "text/plain",
        },
    )
    with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        data = response.read().decode("utf-8")
    if not data.strip():
        raise RuntimeError("CelesTrak returned an empty TLE response")
    return data


def parse_tle_data(raw_data, limit=OBJECT_LIMIT):
    """Parse CelesTrak's 3-line TLE format."""
    lines = [line.strip() for line in raw_data.splitlines() if line.strip()]
    objects = []

    for i in range(0, len(lines) - 2, 3):
        name = lines[i]
        line1 = lines[i + 1]
        line2 = lines[i + 2]

        is_valid, message = validate_tle_pair(line1, line2)
        if not is_valid:
            print(f"Rejected {name}: {message}")
            continue

        norad_1 = line1[2:7].strip()
        norad_2 = line2[2:7].strip()
        if norad_1 != norad_2:
            continue

        epoch = parse_tle_epoch(line1)
        objects.append(
            {
                "object_id": norad_1,
                "name": name,
                "tle": {"line1": line1, "line2": line2},
                "epoch": epoch,
            }
        )

        if len(objects) >= limit:
            break

    return objects


def parse_tle_epoch(line1):
    """Convert TLE epoch into ISO-8601 UTC."""
    epoch_year = int(line1[18:20])
    epoch_day = float(line1[20:32])
    year = 2000 + epoch_year if epoch_year < 57 else 1900 + epoch_year

    epoch = datetime(year, 1, 1, tzinfo=timezone.utc)
    epoch += timedelta(days=epoch_day - 1)
    return epoch.isoformat().replace("+00:00", "Z")


def save_json(objects):
    """Save the processed orbital data to JSON and SQLite."""
    fetched_at = _utc_now().isoformat().replace("+00:00", "Z")
    output = {
        "source": "CelesTrak",
        "fetched_at": fetched_at,
        "objects": objects,
    }

    create_tables()
    for obj in objects:
        insert_orbital_object(
            object_id=obj["object_id"],
            name=obj["name"],
            line1=obj["tle"]["line1"],
            line2=obj["tle"]["line2"],
            epoch=obj["epoch"],
            source="CelesTrak",
            fetched_at=fetched_at,
        )

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
        json.dump(output, file, indent=2)

    print(f"Saved {len(objects)} objects to {OUTPUT_FILE}")


def refresh_snapshot(force=False):
    """Refresh orbital data when the local snapshot is stale.

    SpaceGuard checks at most once per two-hour CelesTrak GP update window.
    A failed refresh never destroys the last validated snapshot, so the
    application can continue operating with the most recent saved data.

    Set force=True for an explicit manual refresh attempt.
    Returns True when fresh data was saved, False when the existing snapshot
    is used instead.
    """
    age = snapshot_age()
    if not force and age is not None and age < REFRESH_INTERVAL:
        print(
            f"CelesTrak snapshot is {age} old; using current cached data "
            "(refresh window is 2 hours)."
        )
        return False

    print("Checking CelesTrak for a new orbital-data update...")
    try:
        raw_data = fetch_tle_data()
        objects = parse_tle_data(raw_data)
        if not objects:
            raise RuntimeError("No valid TLE objects were found")
        save_json(objects)
        print(f"Fresh CelesTrak data loaded: {len(objects)} current objects.")
        return True
    except HTTPError as error:
        if error.code in (403, 404):
            print(
                f"CelesTrak returned HTTP {error.code}; stopping refresh attempts "
                "and keeping the latest saved snapshot."
            )
        else:
            print(f"CelesTrak returned HTTP {error.code}; using the latest snapshot.")
        if not OUTPUT_FILE.exists():
            raise RuntimeError(
                "CelesTrak refresh failed and no orbital_data.json fallback exists"
            ) from error
        return False
    except (URLError, TimeoutError, OSError, RuntimeError, ValueError) as error:
        if not OUTPUT_FILE.exists():
            raise RuntimeError(
                "CelesTrak refresh failed and no orbital_data.json fallback exists"
            ) from error
        print(f"CelesTrak refresh failed: {error}")
        print("Using the latest saved orbital_data.json snapshot instead.")
        return False


def main():
    if not refresh_snapshot(force=True):
        print("Data ingestion completed using the latest available snapshot.")
    else:
        print("Data ingestion completed using fresh CelesTrak data.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Data ingestion failed: {error}")
        raise
