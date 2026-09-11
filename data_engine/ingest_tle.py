#imported necessary libraries for data ingestion
import json
from datetime import datetime , timezone
from pathlib import Path
from urllib.request import Request, urlopen

#change(2)-> added validation
from .validation import validate_tle_pair
from .database import (
    create_tables,
    insert_orbital_object
)
CELESTRAK_URL = (
    "https://celestrak.org/NORAD/elements/"
    "gp.php?GROUP=active&FORMAT=tle"
)

OUTPUT_FILE = Path(__file__).resolve().parent.parent / "data" / "orbital_data.json"

OBJECT_LIMIT = 100


def fetch_tle_data():
    """Fetch the latest TLE data from CelesTrak."""

    request = Request(
        CELESTRAK_URL,
        headers={
            "User-Agent": "SpaceGuardAI/1.0"
        }
    )

    with urlopen(request, timeout=30) as response:
        data = response.read().decode("utf-8")

    return data


def parse_tle_data(raw_data, limit=OBJECT_LIMIT):
    """Parse CelesTrak's 3-line TLE format."""

    lines = [
        line.strip()
        for line in raw_data.splitlines()
        if line.strip()
    ]

    objects = []

    for i in range(0, len(lines) - 2, 3):

        name = lines[i]
        line1 = lines[i + 1]
        line2 = lines[i + 2]

        # Basic TLE structure validation
        is_valid, message = validate_tle_pair(line1, line2)
        if not is_valid:
            print(f"Rejected {name}: {message}")
            continue

        # Extract NORAD ID from both TLE lines
        norad_1 = line1[2:7].strip()
        norad_2 = line2[2:7].strip()

        # Make sure both lines belong to the same object
        if norad_1 != norad_2:
            continue

        # Extract TLE epoch
        epoch = parse_tle_epoch(line1)

        objects.append(
            {
                "object_id": norad_1,
                "name": name,
                "tle": {
                    "line1": line1,
                    "line2": line2
                },
                "epoch": epoch
            }
        )

        if len(objects) >= limit:
            break

    return objects


def parse_tle_epoch(line1):
    """Convert TLE epoch into ISO-8601 UTC."""

    epoch_year = int(line1[18:20])
    epoch_day = float(line1[20:32])

    # TLE convention:
    # 00-56 -> 2000-2056
    # 57-99 -> 1957-1999
    year = 2000 + epoch_year if epoch_year < 57 else 1900 + epoch_year

    epoch = datetime(year, 1, 1, tzinfo=timezone.utc)

    from datetime import timedelta

    epoch += timedelta(days=epoch_day - 1)

    return epoch.isoformat().replace("+00:00", "Z")


def save_json(objects):
    """Save the processed orbital data to JSON and SQLite."""

    fetched_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    output = {
        "source": "CelesTrak",
        "fetched_at": fetched_at,
        "objects": objects
    }

    # Create database table if it does not exist
    create_tables()

    # Store each validated object in the historical database
    for obj in objects:
        insert_orbital_object(
            object_id=obj["object_id"],
            name=obj["name"],
            line1=obj["tle"]["line1"],
            line2=obj["tle"]["line2"],
            epoch=obj["epoch"],
            source="CelesTrak",
            fetched_at=fetched_at
        )

    # Save the latest snapshot as JSON
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
        json.dump(output, file, indent=2)

    print(f"Saved {len(objects)} objects to {OUTPUT_FILE}")

def main():
    print("Fetching orbital data from CelesTrak...")

    raw_data = fetch_tle_data()

    print("Parsing TLE data...")

    objects = parse_tle_data(raw_data)

    if not objects:
        raise RuntimeError("No valid TLE objects were found.")

    save_json(objects)

    print("Data ingestion completed successfully.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Data ingestion failed: {error}")
        raise