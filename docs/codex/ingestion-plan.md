Title: LiveRC Ingestion Plan (Crawler + Importers)
Author: Jayson + The Brainy One
Date: 2025-09-20
Purpose: Define the import workflow that turns a single LiveRC event URL into normalized RCRE data with caching, idempotency and telemetry.
License: MIT

## Inputs
- eventUrl (required) — LiveRC view_event URL
- Filters (optional): classes[], roundTypes[] (practice|qual|main), roundOrdinals[] (ints)
- Flags: force (bypass cache), dryRun (no writes), maxConcurrency (default 4), politenessDelayMs (default 500)

## Outputs (upserts)
Event, Track, Class, Round, Heat, Participant, RaceResult, Lap, RoundRanking, MultiMainStanding, EventOverallResult, SourceCache

## Crawl Order
1. Fetch eventUrl → parse Event + discover links to entry_list, all heat_sheet pages (practice/qual/main), round_ranking, race_result (from “View Results”/index pages), multi_main_result, event_overall_ranking.
2. For each discovered page:
   - Check SourceCache by URL sha; skip parse if unchanged (unless --force).
   - Parse per LiveRC-Metadata.md; stage normalized records.
3. For each race_result page:
   - Upsert results[] per driver.
   - For each result row, follow viewLapsUrl; parse laps[]; upsert Lap by (heatId, driverId, lapNo).
4. Linkages:
   - Map drivers by (name, transponder) to Driver.id.
   - Resolve Track from event.trackName (create if missing).
   - Maintain Class, Round(type+ordinal), Heat ids.

## Idempotency & Keys
- Use the keys defined in LiveRC-Metadata.md (Cross-cutting Requirements).
- Upsert semantics: insert new, update if changed (by sha or field diff).
- Ensure stable race.id/heatSheet.id derivation.

## Caching
- SourceCache { url, fetchedAt, status, sha, body } must be written for every fetch.
- Cache policy: skip unchanged html by sha unless --force.
- Store minimal body (trimmed) but sufficient for re-parse.

## Telemetry
- Events: import_job_started/completed/failed; page_fetch_started/completed; parse_started/completed; records_upserted_count; laps_imported_count.
- Timings: capture ms per fetch, per parse, overall job duration.
- IDs: anonymised session/user IDs where applicable.

## Error Handling
- Retries: 3 with exponential backoff on transient network errors.
- Partial progress: continue other pages if one fails; report failures at end.
- Validation: reject records missing required ids (e.g., eventId, raceId).

## Performance Targets
- P95 setup for import API ≤ 400 ms (job kickoff); background job runs to completion.
- Steady-state parse throughput: ≥ 20 pages/minute with concurrency=4 on cached HTML.

## Interfaces
- API: POST /api/import/liverc { eventUrl, filters, flags }
- CLI: scripts/import-liverc --event <url> [--class "..."] [--type qual] [--force] [--dry-run]
- UI (later): import wizard with progress log and summary counts.

---
