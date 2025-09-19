# Heartbeat Endpoints

These endpoints allow external monitors to query process and dependency health.

## `GET /api/health`
| Property | Type | Description |
| --- | --- | --- |
| `status` | `"ok"` | Always `"ok"` when the HTTP handler responds. |
| `timestamp` | `string` | ISO-8601 timestamp produced by the server. |
| `uptimeSeconds` | `number` | Process uptime in seconds at response time. |

### Semantics
- Indicates the HTTP server is running and able to render a trivial response.
- Does **not** assert that downstream dependencies are ready.

## `GET /api/ready`
When all migrations are applied, the endpoint returns the detailed readiness document:

| Property | Type | Description |
| --- | --- | --- |
| `status` | `"ready" \| "degraded"` | `"ready"` when all checks pass, `"degraded"` otherwise. |
| `timestamp` | `string` | ISO-8601 timestamp at evaluation. |
| `checks` | `Array<ReadinessCheck>` | Detailed result per dependency. |

If Prisma migrations are pending the response is:

| Property | Type | Description |
| --- | --- | --- |
| `ok` | `false` | Indicates the service is not ready. |
| `reason` | `"DB_NOT_MIGRATED"` | Downstream consumers should run `prisma migrate deploy`. |

### `ReadinessCheck`
| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | Human label for the dependency. |
| `healthy` | `boolean` | Indicates whether the dependency passed its probe. |
| `details?` | `string` | Optional human-readable failure context. |
| `durationMs` | `number` | Probe duration in milliseconds. |

### Semantics
- The database probe runs `SELECT 1` against Postgres via Prisma when migrations are current.
- Failures leave the service in `"degraded"` with details explaining the failure.
- Pending migrations block readiness and respond with `503` and `{ ok: false, reason: "DB_NOT_MIGRATED" }`.

## `GET /api/version`
| Property | Type | Description |
| --- | --- | --- |
| `version` | `string` | Semantic version from `package.json` or `"dev"` fallback. |
| `commit?` | `string` | Optional VCS revision (if `GIT_COMMIT` is set). |
| `buildTimestamp` | `string` | ISO-8601 timestamp emitted during response generation. |

### Semantics
- Allows dashboards to display the deployed revision alongside health info.
- Consumers may cache aggressively; the response is immutable for a build.
