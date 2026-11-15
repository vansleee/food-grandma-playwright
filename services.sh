#!/usr/bin/env bash
# Launch/stop backend (food-grandma-fastapi + management) and food-grandma-web
# via Docker Compose.
#
# Usage: ./services.sh [up|down]   (default: up)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTION="${1:-up}"
# Must match backend DEMO_RESET_KEY (docker-compose.yml uses the same default).
export DEMO_RESET_KEY="${DEMO_RESET_KEY:-local-dev-reset-key}"

case "$ACTION" in
  up)
    echo "==> Starting food-grandma-fastapi (backend :8081 + management)"
    (cd "$REPO_ROOT/food-grandma-fastapi" && docker compose up -d --build)

    echo "==> Starting food-grandma-web (:8082)"
    (cd "$REPO_ROOT/food-grandma-web" && docker compose up -d --build)

    echo "==> Seeding demo data"
    curl -fsS -X POST -H "X-Demo-Reset-Key: $DEMO_RESET_KEY" http://localhost:8081/api/test/reset
    curl -fsS -X POST -H "X-Demo-Reset-Key: $DEMO_RESET_KEY" http://localhost:8081/api/test/seed

    cat <<'EOF'

==> Up:
    FastAPI:    http://localhost:8081 (docs at /docs)
    Web:        http://localhost:8082
    Management: http://localhost:8082/management/

Stop with: ./services.sh down
EOF
    ;;
  down)
    echo "==> Stopping food-grandma-web"
    (cd "$REPO_ROOT/food-grandma-web" && docker compose down)

    echo "==> Stopping food-grandma-fastapi"
    (cd "$REPO_ROOT/food-grandma-fastapi" && docker compose down)
    ;;
  *)
    echo "Usage: $0 [up|down]" >&2
    exit 1
    ;;
esac
