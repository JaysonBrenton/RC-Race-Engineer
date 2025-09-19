# LiveRC API Payload Reference

This reference captures representative responses from the public LiveRC API. Each snippet trims unrelated keys while keeping
the metadata we plan to persist. Times are normalised to ISO-8601 UTC.

## Event summary

* **Sample URL**: `https://api.liverc.com/v2/events/30952`
* **Persisted fields**: `eventId`, `title`, `trackName`, `facility`, `city`, `region`, `country`, `timeZone`, `startTime`,
  `endTime`, `website`

```json
{
  "eventId": 30952,
  "title": "2024 ROAR 1/10 Electric Off-Road Nationals",
  "trackName": "HobbyTown HobbyPlex",
  "facility": "Indoor Off-Road",
  "city": "Omaha",
  "region": "NE",
  "country": "USA",
  "timeZone": "America/Chicago",
  "startTime": "2024-08-08T15:00:00Z",
  "endTime": "2024-08-12T02:00:00Z",
  "website": "https://www.hobbyplexraceway.com/"
}
```

## Class listing

* **Sample URL**: `https://api.liverc.com/v2/events/30952/classes`
* **Persisted fields**: `classId`, `eventId`, `name`, `description`

```json
[
  {
    "classId": 91201,
    "eventId": 30952,
    "name": "2WD Modified Buggy",
    "description": "ROAR National Championship"
  },
  {
    "classId": 91202,
    "eventId": 30952,
    "name": "4WD Modified Buggy",
    "description": "ROAR National Championship"
  }
]
```

## Heat schedule

* **Sample URL**: `https://api.liverc.com/v2/classes/91201/heats`
* **Persisted fields**: `heatId`, `classId`, `label`, `round`, `attempt`, `scheduledStart`, `durationSeconds`, `status`

```json
[
  {
    "heatId": 441250,
    "classId": 91201,
    "label": "Round 3 Qualifier - Heat 1",
    "round": 3,
    "attempt": 1,
    "scheduledStart": "2024-08-09T21:40:00Z",
    "durationSeconds": 360,
    "status": "complete"
  },
  {
    "heatId": 441251,
    "classId": 91201,
    "label": "Round 3 Qualifier - Heat 2",
    "round": 3,
    "attempt": 1,
    "scheduledStart": "2024-08-09T21:46:00Z",
    "durationSeconds": 360,
    "status": "in_progress"
  }
]
```

## Entry roster

* **Sample URL**: `https://api.liverc.com/v2/classes/91201/entries`
* **Persisted fields**: `entryId`, `classId`, `driverName`, `carNumber`, `transponder`, `vehicle`, `sponsor`,
  `hometownCity`, `hometownRegion`

```json
[
  {
    "entryId": 558632,
    "classId": 91201,
    "driverName": "Dakotah Phend",
    "carNumber": "9",
    "transponder": "1234567",
    "vehicle": "TLR 22 5.0",
    "sponsor": "TLR / Horizon Hobby",
    "hometownCity": "Detroit",
    "hometownRegion": "MI"
  },
  {
    "entryId": 558633,
    "classId": 91201,
    "driverName": "Spencer Rivkin",
    "carNumber": "1",
    "transponder": "7654321",
    "vehicle": "Associated B7",
    "sponsor": "Team Associated",
    "hometownCity": "Mesa",
    "hometownRegion": "AZ"
  }
]
```

## Heat results

* **Sample URL**: `https://api.liverc.com/v2/heats/441250/results`
* **Persisted fields**: `resultId`, `heatId`, `entryId`, `finishPosition`, `lapsCompleted`, `totalTimeMs`, `fastLapMs`,
  `intervalMs`, `status`

```json
[
  {
    "resultId": 9912501,
    "heatId": 441250,
    "entryId": 558632,
    "finishPosition": 1,
    "lapsCompleted": 12,
    "totalTimeMs": 315420,
    "fastLapMs": 25870,
    "intervalMs": 0,
    "status": "finished"
  },
  {
    "resultId": 9912502,
    "heatId": 441250,
    "entryId": 558633,
    "finishPosition": 2,
    "lapsCompleted": 12,
    "totalTimeMs": 316100,
    "fastLapMs": 26012,
    "intervalMs": 680,
    "status": "finished"
  }
]
```

## Session mapping

* **Sample URL**: `https://api.liverc.com/v2/heats/441250`
* **Persisted fields**: `heatId`, `classId`, `eventId`, `liveStreamUrl`

```json
{
  "heatId": 441250,
  "classId": 91201,
  "eventId": 30952,
  "liveStreamUrl": "https://live.liverc.com/30952-2wd-mod-heat1"
}
```

These payloads inform the Prisma models and the fields surfaced in our domain model.
