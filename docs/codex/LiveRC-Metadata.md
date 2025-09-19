Title: LiveRC Metadata Specification
Author: Jayson + The Brainy One
Date: 2025-09-20
Purpose: Canonical field-level spec for scraping/crawling LiveRC pages used by RCRE (events, rounds, heats/races, results, rankings, laps). Treat this as the single source of truth for names and semantics.
License: MIT

## Page Types (canonical slugs)
- event: `?p=view_event&id=<eventId>` — event hub page
- entry_list: `?p=view_entry_list&id=<eventId>` — per-class entries
- heat_sheet: `?p=view_heat_sheet&id=<heatSheetId>` — practice/qual/main lineups
- round_ranking: `?p=view_round_ranking&id=<roundId>&o=<mode>` — per-round overall rankings
- race_result: `?p=view_race_result&id=<raceId>` — single race (qual/main) result summary + per-driver lap links
- multi_main_result: `?p=view_multi_main_result&id=<multiMainId>` — A1/A2/A3 standings
- event_overall_ranking: `?p=event_overall_ranking&id=<eventId>` — event/class final results

> Selector strategy: Prefer stable, visible labels/column headers (e.g., “Laps/Time”, “Top 3 Consecutive”) and table structure. Avoid brittle CSS paths. Always persist sourceUrl, fetchedAt, and raw HTML in SourceCache with sha.

## Common Vocabulary
- Class: e.g., “1/8 Electric Buggy”, “1/8 Nitro Buggy”
- Round: practice | qual | main + ordinal (e.g., 6 for Q6)
- Heat/Race: specific on-track session within a round (e.g., Heat 4/4, A-Main, M1 Race #10)

## event (view_event)
Fields
- event.id (string) — LiveRC event id
- event.name (string)
- event.trackName (string)
- event.dateStart (ISO8601)
- event.dateEnd (ISO8601)
- event.stats.entries (int)
- event.stats.drivers (int)
- event.stats.totalLaps (int)
- links.entryListUrl (url)
- links.discovered[] (urls to entry_list, heat_sheet*, round_ranking, race_result, multi_main_result, event_overall_ranking)
- sourceUrl (url)
- fetchedAt (ISO8601)
Example
- event.id = "462466"
- event.name = "2025 RCRA Campbelltown Hobbies ACT State Titles"
- event.trackName = "Canberra Off Road Model Car Club"
- dateStart = 2025-03-07, dateEnd = 2025-03-09

## entry_list (view_entry_list)
Fields
- eventId
- class.name
- entries[]: { driver.name, transponder, carNumber? }
- class.entryCount (int)
- sourceUrl, fetchedAt
Example
- class.name = "1/8 Electric Buggy"
- entries[i].driver = "JAYSON BRENTON"
- entries[i].transponder = "8970568"

## heat_sheet (view_heat_sheet)
Fields
- heatSheet.id (string)
- eventId, class.name
- round.type (practice|qual|main)
- round.ordinal (int)
- round.label (e.g., "Qualifier Round 6")
- heat.name (e.g., "Heat 4/4", "A-Main", "Race #10")
- heat.lengthSec (int; e.g., 300, 420, 600)
- heat.timed (bool)
- heat.status (string)
- grid[]: { pos, carNumber, driver.name, transponder, seedNumber?, seedResultText? }
- viewResultUrl (url?)
- sourceUrl, fetchedAt
Example
- round.type="qual", round.ordinal=6, heat.name="Heat 4/4"
- grid[0] = { pos:1, carNumber:3, driver:"ALEX BERNADZIK", transponder:"<id>" }

## round_ranking (view_round_ranking)
Fields
- round.id, eventId, class.name
- round.type="qual"
- round.ordinal (int)
- rankMode (enum): laps_time | top2 | top3 | top5 | avg | fastest
- rows[]: { rank, driver.name, transponder?, laps, timeMs, top2Ms?, top3Ms?, top5AvgMs?, fastestLapMs?, avgLapMs?, heatRef }
- sourceUrl, fetchedAt
Example
- rank=1, driver="ALEX BERNADZIK", laps=12, timeMs=448821 (7:28.821)

## race_result (view_race_result)
Fields
- race.id (string), eventId, class.name
- round.type (practice|qual|main), round.ordinal (int)
- heat.name
- lengthSec (int)
- raceNumberLabel (e.g., "M1 Race #10", "Q6 Race #7")
- results[] per driver:
  { pos, qualified?, laps, totalTimeMs, behindText, fastestLapMs, fastestLapNo, avgLapMs, avgTop5Ms, avgTop10Ms, avgTop15Ms, top3ConsecMs, stdDevMs, consistencyPct, viewLapsUrl }
- sourceUrl, fetchedAt
Examples
- Main winner: pos=1, laps=73, totalTimeMs≈2716678, fastestLapMs≈35670, consistencyPct≈93.11
- Qual winner: pos=1, laps=11, totalTimeMs≈449642, fastestLapMs≈39554, consistencyPct≈98.27

## multi_main_result (view_multi_main_result)
Fields
- multiMain.id, eventId, class.name
- tieBreaker (e.g., IFMAR)
- rows[]:
  { driver.name, qualifiedPos, pointsTotal, legs: { A1:{place,points,laps,timeMs}, A2:{...}, A3:{...} } }
- sourceUrl, fetchedAt
Example
- driver="ALEX BERNADZIK", pointsTotal=2, A1.place=1, A3.place=1

## event_overall_ranking (event_overall_ranking)
Fields
- eventId, class.name
- rows[]: { pos, driver.name, resultLaps, resultTimeMs, mainRef?, brand?, country? }
- sourceUrl, fetchedAt
Example
- pos=1, driver="ALEX BERNADZIK", resultLaps=17, resultTimeMs≈613929, mainRef="A"

## Lap detail (via per-driver “View Laps”)
Fields
- race.id, driver.name, driver.transponder
- laps[]: { lapNo, lapTimeMs, pit?, invalid? }
- sourceUrl, fetchedAt
Example
- laps[1].lapTimeMs≈37014; laps[7].lapTimeMs≈40250

## Cross-cutting Requirements
- Persist SourceCache { id, url, fetchedAt, status, sha, body } for every fetch
- Idempotency keys:
  - Event: id
  - Class: (eventId, name)
  - Round: (eventId, classId, type, ordinal)
  - Heat/Race: id
  - Participant: (heatId, driverId)
  - RaceResult: (heatId, driverId)
  - Lap: (heatId, driverId, lapNo)
  - RoundRanking: (roundId, classId, driverId, rankMode)
  - MultiMainStanding: (eventId, classId, driverId)
  - EventOverallResult: (eventId, classId, driverId)
- Telemetry events:
  - import_job_started/completed/failed
  - page_fetch_started/completed (url, ms, status, cacheHit)
  - parse_started/completed (pageType, rows)
  - laps_imported_count, records_upserted_count
- Performance notes:
  - Parser should process typical pages < 150 ms each on cached HTML
  - Avoid blocking UI; long operations run as background jobs with progress logs

---
