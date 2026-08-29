#!/usr/bin/env bash
# Auto-capture nest startup log and generate Postman collection.
# Requires: api NOT already running on configured port (will fail with EADDRINUSE).
# Usage: npm run postman:gen
set -euo pipefail

cd "$(dirname "$0")/.."

LOG=$(mktemp /tmp/pms-api.XXXXXX)
echo "→ starting api, log: $LOG"
npm run start:dev > "$LOG" 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT

deadline=$((SECONDS + 120))
until grep -q "Nest application successfully started" "$LOG" 2>/dev/null; do
    if ! kill -0 $PID 2>/dev/null; then
        echo "✗ api process died. log tail:" >&2
        tail -30 "$LOG" >&2
        exit 1
    fi
    if (( SECONDS > deadline )); then
        echo "✗ timeout waiting for api ready" >&2
        exit 1
    fi
    sleep 1
done

echo "→ api ready, generating collection..."
python3 scripts/gen-postman.py "$LOG"
echo "→ shutting down api"
kill $PID 2>/dev/null || true
