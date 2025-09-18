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
| Property | Type | Description |
| --- | --- | --- |
| `status` | `"ready" \| "degraded"` | `"ready"` when all checks pass, `"degraded"` otherwise. |
| `timestamp` | `string` | ISO-8601 timestamp at evaluation. |
| `checks` | `Array<ReadinessCheck>` | Detailed result per dependency. |

### `ReadinessCheck`
| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | Human label for the dependency. |
| `healthy` | `boolean` | Indicates whether the dependency passed its probe. |
| `details?` | `string` | Optional human-readable failure context. |
| `durationMs` | `number` | Probe duration in milliseconds. |

### Semantics
- The database probe runs `SELECT 1` against Postgres via Prisma.
- Failures leave the service in `"degraded"` with details explaining the failure.

## `GET /api/version`
| Property | Type | Description |
| --- | --- | --- |
| `version` | `string` | Semantic version from `package.json` or `"dev"` fallback. |
| `commit?` | `string` | Optional VCS revision (if `GIT_COMMIT` is set). |
| `buildTimestamp` | `string` | ISO-8601 timestamp emitted during response generation. |

### Semantics
- Allows dashboards to display the deployed revision alongside health info.
- Consumers may cache aggressively; the response is immutable for a build.
