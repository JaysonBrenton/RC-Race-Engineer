# Session Endpoints

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
| `createdAt` | `string` | ISO timestamp for creation. |

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
