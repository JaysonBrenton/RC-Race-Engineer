Title: Model Extensions for LiveRC Ingestion
Author: Jayson + The Brainy One
Date: 2025-09-20
Purpose: Target schema contract Codex will translate into Prisma models/migrations and API DTOs.
License: MIT

## Entities (fields are indicative; Codex will map to Prisma types)
Event
- id (string, pk)
- name (string)
- trackId (fk Track.id)
- startsAt (datetime)
- endsAt (datetime)
- statsEntries (int)
- statsDrivers (int)
- statsTotalLaps (int)
- sourceUrl (string)
- createdAt (datetime, default now)

Track
- id (string, pk)
- name (string)
- city (string?)
- country (string?)
- surface (string?)
- providerSlug (string?)
- createdAt (datetime)

Class
- id (string, pk)
- eventId (fk)
- name (string)
- createdAt (datetime)
- UNIQUE (eventId, name)

Round
- id (string, pk)
- eventId (fk)
- classId (fk)
- type (enum: practice | qual | main)
- ordinal (int)
- label (string)
- sourceUrl (string)
- createdAt (datetime)
- UNIQUE (eventId, classId, type, ordinal)

Heat  // aka Race
- id (string, pk)           // LiveRC race/heat id
- roundId (fk)
- classId (fk)
- name (string)             // e.g., "Heat 4/4", "A-Main", "Race #10"
- lengthSec (int)
- timed (bool)
- status (string)
- startedAt (datetime?)
- completedAt (datetime?)
- seedNumber (int?)
- seedTotal (int?)
- seedResultText (string?)
- sourceUrl (string)
- createdAt (datetime)

Participant
- id (string, pk)
- heatId (fk)
- driverId (fk)
- carNumber (int?)
- gridPos (int?)
- transponder (string)
- seedNumber (int?)
- createdAt (datetime)
- UNIQUE (heatId, driverId)

Driver
- id (string, pk)
- name (string)
- transponder (string)      // nullable allowed but UNIQUE on (name, transponder) when present
- avatarUrl (string?)
- createdAt (datetime)
- UNIQUE (name, transponder)

RaceResult  // per driver per race summary
- id (string, pk)
- heatId (fk)
- driverId (fk)
- position (int)
- qualified (int?)          // grid spot
- laps (int)
- totalTimeMs (int)
- behindText (string)       // “+1 lap” or “+00:03.215”
- fastestLapMs (int)
- fastestLapNo (int)
- avgLapMs (int)
- avgTop5Ms (int?)
- avgTop10Ms (int?)
- avgTop15Ms (int?)
- top3ConsecMs (int?)
- stdDevMs (int?)
- consistencyPct (float?)   // 0..100
- sourceUrl (string)
- createdAt (datetime)
- UNIQUE (heatId, driverId)

Lap
- id (string, pk)
- heatId (fk)
- driverId (fk)
- lapNo (int)
- lapTimeMs (int)
- pit (bool)
- invalid (bool)
- createdAt (datetime)
- UNIQUE (heatId, driverId, lapNo)

RoundRanking
- id (string, pk)
- roundId (fk)
- classId (fk)
- driverId (fk)
- rankMode (enum: laps_time | top2 | top3 | top5 | avg | fastest)
- rankPosition (int)
- laps (int)
- timeMs (int)
- top2ConsecMs (int?)
- top3ConsecMs (int?)
- top5AvgMs (int?)
- fastestLapMs (int?)
- avgLapMs (int?)
- heatRef (string?)
- createdAt (datetime)
- UNIQUE (roundId, classId, driverId, rankMode)

MultiMainStanding
- id (string, pk)
- eventId (fk)
- classId (fk)
- driverId (fk)
- tieBreaker (string)
- legsCompleted (int)
- pointsTotal (int)
- A1_place (int?)  A1_points (int?)  A1_laps (int?)  A1_timeMs (int?)
- A2_place (int?)  A2_points (int?)  A2_laps (int?)  A2_timeMs (int?)
- A3_place (int?)  A3_points (int?)  A3_laps (int?)  A3_timeMs (int?)
- createdAt (datetime)
- UNIQUE (eventId, classId, driverId)

EventOverallResult
- id (string, pk)
- eventId (fk)
- classId (fk)
- driverId (fk)
- resultLaps (int)
- resultTimeMs (int)
- mainRef (string?)
- brand (string?)
- country (string?)
- createdAt (datetime)
- UNIQUE (eventId, classId, driverId)

SourceCache
- id (string, pk)
- url (string)
- fetchedAt (datetime)
- status (int)
- sha (string)
- body (text)
- createdAt (datetime)
- UNIQUE (url, sha)

## Indexes (recommended)
- Heat: index (classId, roundId), (name), (startedAt)
- RaceResult: index (heatId), (driverId)
- Lap: index (heatId, driverId, lapNo)
- RoundRanking: index (roundId, classId, rankMode, rankPosition)

## Relationships
- Event 1-N Class, Round
- Round 1-N Heat
- Heat 1-N Participant, RaceResult, Lap
- Driver 1-N Participant, RaceResult, Lap
- Class 1-N Round, Heat
- Event 1-N RoundRanking, MultiMainStanding, EventOverallResult (via Class)

## Migration Notes
- Generate Prisma migration; add foreign keys and unique constraints exactly as above.
- Add seed script to create Track from event.trackName if missing.

---
