#!/bin/bash
# Run the generated 03-order-mark-ready API tests against food-grandma-fastapi
# copies that each carry one seeded defect (see mutate.py).
#
# The repo's backend source and the Docker stack are never touched: every
# mutant runs from a fresh copy under $WORK_DIR, on its own port and SQLite DB.
#
# Usage: scripts/mutation-check/run.sh [mutant ...]   (default: all mutants)
# Env:   WORK_DIR (default: $TMPDIR/food-grandma-mutation), PORT (default: 8091)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HERE="$ROOT/scripts/mutation-check"
BACKEND="$ROOT/food-grandma-fastapi"
HARNESS="$ROOT/tests/e2e/ai-agent/food-grandma-fastapi"
WORK_DIR="${WORK_DIR:-${TMPDIR:-/tmp}/food-grandma-mutation}"
PORT="${PORT:-8091}"
URL="http://127.0.0.1:$PORT"
MUTANTS=("$@")
[ ${#MUTANTS[@]} -eq 0 ] && MUTANTS=(baseline M1-extra-field M2-touch-other-order M3-not-persisted M4-no-cooking-guard)

mkdir -p "$WORK_DIR/results"
if [ ! -x "$WORK_DIR/venv/bin/uvicorn" ]; then
  python3 -m venv "$WORK_DIR/venv"
  "$WORK_DIR/venv/bin/pip" install -q -r "$BACKEND/requirements.txt"
fi

SERVER_PID=""
# `wait` on a killed server returns 143; never let that trip `set -e`.
stop_server() {
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  SERVER_PID=""
}
trap stop_server EXIT

for name in "${MUTANTS[@]}"; do
  if curl -s -o /dev/null "$URL/openapi.json"; then
    echo "port $PORT already in use; stop that server first" >&2; exit 1
  fi

  rm -rf "$WORK_DIR/backend" "$WORK_DIR/db"
  mkdir -p "$WORK_DIR/backend" "$WORK_DIR/db"
  cp -R "$BACKEND/app" "$WORK_DIR/backend/"
  "$WORK_DIR/venv/bin/python" -I "$HERE/mutate.py" \
    "$BACKEND/app/routers/restaurant.py" "$WORK_DIR/backend/app/routers/restaurant.py" "$name"

  # exec so $! is uvicorn itself, not a subshell that would survive `kill`.
  (cd "$WORK_DIR/backend" && exec env DATABASE_URL="sqlite:///$WORK_DIR/db/test.db" \
    DEMO_RESET_KEY=local-dev-reset-key SESSION_SECRET_KEY=mutation-check STRIPE_API_KEY=sk_test_dummy \
    "$WORK_DIR/venv/bin/uvicorn" app.main:app --port "$PORT" > "$WORK_DIR/results/$name.server.log" 2>&1) &
  SERVER_PID=$!
  for _ in $(seq 1 50); do curl -s -o /dev/null "$URL/openapi.json" && break; sleep 0.2; done

  echo "### $name"
  (cd "$HARNESS" && API_BASE_URL="$URL" npx playwright test --config playwright.generated.config.ts \
    --project api --reporter=list > "$WORK_DIR/results/$name.txt" 2>&1) || true
  grep -E "✓|✘|passed|failed" "$WORK_DIR/results/$name.txt" | sed 's/^ *//' | cut -c1-120 || true
  stop_server
done

echo "Full output: $WORK_DIR/results/"
