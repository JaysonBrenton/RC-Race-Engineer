#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
READY_ENDPOINT="${READY_ENDPOINT:-http://localhost:3000/api/ready}"

(
  cd "$ROOT_DIR/web"
  npx prisma generate
  npx prisma migrate deploy
)

curl --fail --silent --show-error "$READY_ENDPOINT" >/dev/null
