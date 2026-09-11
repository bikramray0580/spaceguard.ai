import time
from datetime import datetime, timezone
 
from .ingest_tle import main as ingest_tle
 
INTERVAL_SECONDS = 2 * 60 * 60
MAX_ATTEMPTS = 3
RETRY_DELAYS_SECONDS = [30, 120]
 
 
def _utc_now():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
 
 
def run_ingestion():
    print(f"{_utc_now()} Ingestion run started")
 
    for attempt in range(1, MAX_ATTEMPTS + 1):
        print(f"{_utc_now()} Ingestion attempt {attempt}/{MAX_ATTEMPTS}")
        try:
            ingest_tle()
            print(f"{_utc_now()} Ingestion run finished")
            return
        except Exception as error:
            print(f"{_utc_now()} Ingestion attempt {attempt} failed: {error}")
            if attempt < MAX_ATTEMPTS:
                delay = RETRY_DELAYS_SECONDS[attempt - 1]
                print(f"{_utc_now()} Waiting {delay} seconds before retry")
                time.sleep(delay)
 
    print(f"{_utc_now()} Ingestion update failed after {MAX_ATTEMPTS} attempts")
 
 
def main():
    while True:
        run_ingestion()
        time.sleep(INTERVAL_SECONDS)
 
 
if __name__ == "__main__":
    main()