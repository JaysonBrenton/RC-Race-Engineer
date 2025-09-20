# Session Endpoints

> **Authentication**
>
> All endpoints require either the `rc-dev-auth` session cookie (issued via the development login) or a bearer token matching
> `DEV_API_TOKEN`. Requests without credentials return `401`.

## `GET /api/sessions`
Returns the most recent sessions ordered by creation date (descending).

### Response
| Property | Type | Description |
| --- | --- | --- |
| `sessions` | `Array<Session>` | Ordered list of sessions. |

### `Session`
| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` | Session identifier (UUID). |
| `name` | `string` | Human readable label. |
| `description` | `string \| null` | Optional freeform summary. |
| `kind` | `SessionKind` | Categorisation of the session. |
| `status` | `SessionStatus` | Lifecycle state. |
| `scheduledStart` | `string \| null` | ISO timestamp for planned start. |
| `scheduledEnd` | `string \| null` | ISO timestamp for planned end. |
| `actualStart` | `string \| null` | ISO timestamp for actual start. |
| `actualEnd` | `string \| null` | ISO timestamp for actual end. |
| `timingProvider` | `TimingProvider` | `"MANUAL"` or `"LIVE_RC"`. |
| `liveRc` | `LiveRcMetadata \| null` | Populated when `timingProvider` is `"LIVE_RC"`. |
| `createdAt` | `string` | ISO timestamp for creation. |

### `LiveRcMetadata`
| Property | Type | Description |
| --- | --- | --- |
| `heatId` | `string` | Internal identifier for the linked LiveRC heat. |
| `heatExternalId` | `number` | LiveRC heat identifier. |
| `label` | `string` | Human label (e.g., `Round 3 Qualifier - Heat 1`). |
| `round` | `number \| null` | Event round number supplied by LiveRC. |
| `attempt` | `number \| null` | Attempt/run indicator. |
| `scheduledStart` | `string \| null` | ISO timestamp for the heat start. |
| `durationSeconds` | `number \| null` | Scheduled heat duration. |
| `status` | `string \| null` | LiveRC status flag (`scheduled`, `in_progress`, `complete`, etc.). |
| `liveStreamUrl` | `string \| null` | Optional stream URL provided by LiveRC. |
| `class` | `{ id: string; externalClassId: number; name: string } \| null` | Class metadata when available. |
| `event` | `{ id: string; externalEventId: number; title: string; ... } \| null` | Event metadata when available. |

## `POST /api/sessions`
Creates a new session record.

### Request Body
| Property | Type | Constraints |
| --- | --- | --- |
| `name` | `string` | 1–120 characters. |
| `description?` | `string` | ≤ 500 characters. |
| `kind` | `SessionKind` | One of `FP1`, `FP2`, `FP3`, `PRACTICE`, `QUALIFYING`, `RACE`, `TEST`, `OTHER`. |
| `scheduledStart?` | `string` | ISO timestamp (UTC). Must be before `scheduledEnd` when both provided. |
| `scheduledEnd?` | `string` | ISO timestamp (UTC). Must be after `scheduledStart` when provided. |
| `timingProvider?` | `TimingProvider` | Defaults to `"MANUAL"`. `"LIVE_RC"` requires `liveRcHeatId`. |
| `liveRcHeatId?` | `string` | Internal LiveRC heat identifier to bind when `timingProvider` is `"LIVE_RC"`. |

### Response
| Property | Type | Description |
| --- | --- | --- |
| `session` | `Session` | Newly created session.

### Failure Modes
| Code | Description |
| --- | --- |
| `400` | Validation failed (invalid enum, invalid time range, missing fields). |
| `500` | Unexpected database failure. |

### Notes
- All timestamps are normalised to UTC by the service.
- The authenticated user context is not yet wired; the endpoint trusts the caller.

## `GET /api/sessions/{id}/events`
Returns telemetry samples for the given session ordered by `recordedAt`.

### Query Parameters
| Parameter | Type | Description |
| --- | --- | --- |
| `limit?` | `number` | Maximum number of samples to return (default 500). |

### Response
| Property | Type | Description |
| --- | --- | --- |
| `session` | `Session` | Metadata for the session (see above). |
| `samples` | `Array<TelemetrySample>` | Ordered telemetry samples. |

### `TelemetrySample`
| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` | Telemetry sample identifier. |
| `sessionId` | `string` | Owning session id. |
| `recordedAt` | `string` | ISO timestamp (UTC). |
| `speedKph` | `number \| null` | Instantaneous speed (km/h). |
| `throttlePct` | `number \| null` | Throttle position (0–100). |
| `brakePct` | `number \| null` | Brake pressure (0–100). |
| `rpm` | `number \| null` | Engine RPM. |
| `gear` | `number \| null` | Gear index (-1 to 12). |
| `createdAt` | `string` | Ingest timestamp. |

## `POST /api/sessions/{id}/events`
Records a telemetry sample for the session.

### Request Body
| Property | Type | Constraints |
| --- | --- | --- |
| `recordedAt` | `string` | ISO-8601 timestamp. |
| `speedKph?` | `number` | ≥ 0 and ≤ 450. |
| `throttlePct?` | `number` | 0–100. |
| `brakePct?` | `number` | 0–100. |
| `rpm?` | `number` | Integer 0–30 000. |
| `gear?` | `number` | Integer -1–12. |

### Response
| Property | Type | Description |
| --- | --- | --- |
| `sample` | `TelemetrySample` | The stored sample. |

### Failure Modes
| Code | Description |
| --- | --- |
| `400` | Validation failed (invalid schema or range). |
| `404` | Session not found. |
| `500` | Unexpected database failure. |
