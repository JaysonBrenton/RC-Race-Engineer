# The RC Racing Engineer — Domain Model (Draft)

This document is the source of truth for entities, relations, and invariants. PRs that change the model must update this document and follow the **Model Change Protocol** in `AGENTS.md`.

## Entities (first pass)
- **Team** *(optional if single-tenant)*
- **User**
- **Driver**
- **Car**
- **Track**
- **Event** (e.g., race weekend)
- **Session** (practice/qualifying/race)
- **TimingProvider** (enum representing telemetry/timing source)
- **LiveRcEvent** (external event metadata)
- **LiveRcClass** (class/category within a LiveRC event)
- **LiveRcHeat** (specific round/heat published by LiveRC)
- **LiveRcEntry** (competitor roster from LiveRC)
- **LiveRcResult** (per-heat finishing data from LiveRC)
- **Lap**
- **Stint**
- **TelemetrySample** (time-series metrics per car)
- **SetupSheet** (baseline + adjustments)
- **WeatherSnapshot**
- **TyreSet**
- **Incident** (flags, notes, steward events)
- **Annotation** (engineer notes tied to time/lap)

## Relationships (rough)
```mermaid
graph TD
  Team --< Users
  Team --< Cars
  Team --< Drivers
  Event --> Track
  Event --< Sessions
  TimingProvider --> Session
  LiveRcEvent --< LiveRcClass
  LiveRcClass --< LiveRcHeat
  LiveRcClass --< LiveRcEntry
  LiveRcHeat --< LiveRcResult
  LiveRcHeat --> Session
  LiveRcResult --> LiveRcEntry
  LiveRcHeat --> LiveRcClass
  LiveRcClass --> LiveRcEvent
  Session --< Stints
  Session --< Laps
  Stint --> Car
  Stint --> Driver
  Lap --> Session
  Lap --> Car
  TelemetrySample --> Session
  TelemetrySample --> Car
  TelemetrySample --> Driver
  TelemetrySample --> Lap
  SetupSheet --> Car
  SetupSheet --> Session
  WeatherSnapshot --> Session
  TyreSet --> Session
  TyreSet --> Car
  TyreSet --> Driver
  Incident --> Session
  Incident --> Lap
  Annotation --> Session
  Annotation --> Lap
```

## Attributes & invariants
- **Team**: `id`, `name`, `primaryColor`, `secondaryColor`. *Invariant*: name unique per deployment.
- **User**: `id`, `teamId`, `email`, `role` (`engineer`, `strategist`, `viewer`). *Invariant*: `(teamId, email)` unique; role constrained to allow lists.
- **Driver**: `id`, `teamId`, `code`, `fullName`, `country`. *Invariant*: `code` unique per team; drivers archived rather than deleted.
- **Car**: `id`, `teamId`, `identifier` (e.g., 63), `chassis`, `powerUnit`. *Invariant*: identifier unique within team per season.
- **Track**: `id`, `name`, `country`, `layoutVersion`, `lengthKm`, `turnCount`, `timezone`. *Invariant*: `(name, layoutVersion)` unique.
- **Event**: `id`, `trackId`, `season`, `round`, `name`, `startDate`, `endDate`. *Invariant*: `(season, round)` unique; `startDate <= endDate`.
- **Session**: `id`, `name`, `description?`, `eventId?`, `kind` (`FP1`, `FP2`, `FP3`, `Practice`, `Qualifying`, `Race`, `Test`, `Other`), `status` (`Scheduled`, `Live`, `Complete`, `Cancelled`), `scheduledStart?`, `scheduledEnd?`, `actualStart?`, `actualEnd?`, `createdAt`, `updatedAt`. *Invariant*: `scheduledEnd` ≥ `scheduledStart` when both present; actual times fall within the scheduled range when provided.
- **TimingProvider**: enum of `Manual`, `LiveRc`. *Invariant*: `LiveRc` sessions must link to `LiveRcHeat` metadata.
- **LiveRcEvent**: `id`, `externalEventId`, `title`, `trackName`, `facility?`, `city?`, `region?`, `country?`, `timeZone?`, `startTime?`, `endTime?`, `website?`, `createdAt`, `updatedAt`. *Invariant*: `externalEventId` unique; date range respects `startTime <= endTime` when both present.
- **LiveRcClass**: `id`, `eventId`, `externalClassId`, `name`, `description?`, `createdAt`, `updatedAt`. *Invariant*: combination `(eventId, externalClassId)` unique.
- **LiveRcHeat**: `id`, `classId`, `externalHeatId`, `label`, `round?`, `attempt?`, `scheduledStart?`, `durationSeconds?`, `status?`, `liveStreamUrl?`, `createdAt`, `updatedAt`. *Invariant*: `(classId, externalHeatId)` unique; heat schedules must fall within the parent event window when known.
- **LiveRcEntry**: `id`, `classId`, `externalEntryId`, `driverName`, `carNumber?`, `transponder?`, `vehicle?`, `sponsor?`, `hometownCity?`, `hometownRegion?`, `createdAt`, `updatedAt`. *Invariant*: `(classId, externalEntryId)` unique.
- **LiveRcResult**: `id`, `heatId`, `entryId`, `externalResultId`, `finishPosition?`, `lapsCompleted?`, `totalTimeMs?`, `fastLapMs?`, `intervalMs?`, `status?`, `createdAt`, `updatedAt`. *Invariant*: `(heatId, entryId)` unique; `finishPosition` positive when present.
- **Stint**: `id`, `sessionId`, `carId`, `driverId`, `tyreSetId`, `startLap`, `endLap`, `compound`, `fuelStartKg`, `fuelEndKg`. *Invariant*: `startLap <= endLap`; stints for same car cannot overlap laps.
- **Lap**: `id`, `sessionId`, `carId`, `lapNumber`, `driverId`, `timeMs`, `isInLap`, `isOutLap`, `isPitLap`, `sector1Ms`, `sector2Ms`, `sector3Ms`, `trackStatus`. *Invariant*: lap numbers contiguous per session+car; sector sums within ±10ms of `timeMs`.
- **TelemetrySample**: `id`, `sessionId`, `carId?`, `driverId?`, `lapId?`, `recordedAt`, `speedKph?`, `throttlePct?`, `brakePct?`, `rpm?`, `gear?`, `createdAt`. *Invariant*: timestamps monotonic per session+car; throttle/brake 0–100; gear in allowed set.
- **SetupSheet**: `id`, `sessionId`, `carId`, `baselineVersion`, `wingAngle`, `rideHeight`, `camber`, `toe`, `suspension`, `notes`, `createdBy`. *Invariant*: one active baseline per session+car; values within engineering bounds (see appendix).
- **WeatherSnapshot**: `id`, `sessionId`, `timestamp`, `airTempC`, `trackTempC`, `humidityPct`, `pressureHpa`, `windSpeedKph`, `windDirectionDeg`, `weatherCondition`. *Invariant*: timestamps align with telemetry sampling frequency.
- **TyreSet**: `id`, `sessionId`, `carId`, `compound`, `ageLaps`, `isNew`, `serial`, `assignedAt`, `returnedAt?`. *Invariant*: `serial` unique per event; tyre set cannot be active in overlapping stints.
- **Incident**: `id`, `sessionId`, `lapId?`, `timecode`, `flag`, `description`, `severity`. *Invariant*: `flag` from controlled vocabulary; severity used for alerting thresholds.
- **Annotation**: `id`, `sessionId`, `lapId?`, `timecode`, `authorId`, `category`, `message`, `visibility`. *Invariant*: visibility in {team, car, personal}; author must belong to same team.

## Derived views & aggregates
- **Session summary**: per car, aggregate fastest lap, stint average pace, total pit time, tyre usage.
- **Driver comparison**: aligned telemetry for two drivers (speed, throttle, brake, rpm, gear) with delta trace.
- **Strategy view**: timeline of stints, tyre sets, fuel usage, weather overlays.
- **Reliability dashboard**: aggregated alerts (engine temps, brake fade, ERS state) with thresholds and last-occurrence times.

## Domain events
- `SessionScheduled`, `SessionStarted`, `SessionPaused`, `SessionResumed`, `SessionCompleted`
- `StintStarted`, `StintCompleted`
- `LapCompleted`
- `TelemetryIngested`
- `IncidentLogged`
- `AnnotationAdded`
- `SetupUpdated`

## Open questions
1. Do we support multiple teams per deployment or assume single-team SaaS? Impacts auth scopes.
2. How to model shared cars (e.g., endurance) where multiple drivers share same stint? Possibly allow `driverId` array per stint.
3. Telemetry volume: do we store raw Hz-level data or downsample for analytics? Storage + query strategy open.
4. Need to clarify integration with external timing providers for authoritative lap/sector data.

## Next steps
- Produce ERD diagram with finalized attributes (use Prisma schema once available).
- Define API contracts in `docs/api/` for core operations (session list, telemetry fetch, annotations CRUD).
- Establish validation schemas (Zod) for telemetry ingestion pipeline.
- Align design tokens referenced in `docs/design-principles.md` with actual implementation in web layer.
