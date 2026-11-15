# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Companion repo for teaching Playwright + AI-agent E2E testing patterns (阿嬤，這次讓 AI 測試就好！), using the Food Grandma website and API. The default reader branch is `master`; see the root README, `tests/e2e/README.md` and `CONTRIBUTING.md` for current navigation and maintenance rules.

Part one uses the hand-written `tests/e2e/manual/` exercises. Part two follows original `tests/e2e/v1/` → chapter examples in `tests/e2e/chapters/` → original `tests/e2e/v2/`. Both original versions were generated independently against the same specs and cases; v2 read part two but did not read v1. Preserve both originals. Chapter examples are teaching adaptations with three versions and Arrange/Act/Assert comments; patterns absent from the original v2 are identified as teaching extensions. Full experimental records stay in `experiments/part-two/`.

Part three uses `tests/e2e/ai-agent/` for Planner, Generator and Healer exercises. Keep manual and AI authorship separate: do not let AI-authoring leak into `manual/`, or silently hand-tune original AI output. Record any prompt-driven iteration or teaching adaptation separately.

## Repo layout

- `tests/e2e/v1/` and `tests/e2e/v2/` — original independent AI outputs. Run through the chapters entry point; do not refactor the originals for a chapter exercise.
- `tests/e2e/chapters/` — part-two examples and the shared runner, which prepares independent databases and services. See its README for setup and expected teaching failures; no per-chapter COMPARISON.md files.
- `tests/e2e/manual/<target>/` (hand-written) and `tests/e2e/ai-agent/<target>/` (AI agent) — separate Playwright suites (own `package.json`, `playwright.config.ts`, `tests/`). Their website startup and execution instructions are in `docs/existing-exercises.md`.
- Target apps live at the repo root, all-lowercase folder names. Currently:
  - `food-grandma-fastapi/` — FastAPI backend, port 8081. This is Food Grandma reimplemented in FastAPI — a restaurant/customer/driver food-ordering app with an order status machine and OAuth2-style bearer-token auth.
  - `food-grandma-management/` — React SPA restaurant dashboard for `food-grandma-fastapi`. Native Vite uses internal port 5180; Docker exposes internal port 80 without publishing a host port. Readers open it through `http://localhost:8082/management/`. `food-grandma-fastapi/docker-compose.yml`'s `management` service builds it via a `../food-grandma-management` (cross-directory) build context.
  - `food-grandma-web/` — React + Vite customer/driver website (restaurants, menu, cart, checkout, delivery tracking, driver pickup/earnings), against `food-grandma-fastapi`'s customer/driver API. Demo entry buttons use the seeded customer/driver tokens.

**Note:** `food-grandma-fastapi` is currently the only target app, with suites at `tests/e2e/manual/food-grandma-fastapi/` and `tests/e2e/ai-agent/food-grandma-fastapi/`.

## Running a Playwright suite

Each `tests/e2e/manual/<target>/` and `tests/e2e/ai-agent/<target>/` is an independent npm project:

```bash
cd tests/e2e/manual/food-grandma-fastapi   # or any other tests/e2e/manual|ai-agent / <target> dir
npm install
npx playwright install --with-deps chromium
npm test                       # runs `playwright test`
```

The target app (backend + frontend, per that target's README) must already be running at the `baseURL` in that suite's `playwright.config.ts` — Playwright does not start it for you.

To run a single test file or test, use Playwright's own filters from inside the suite dir, e.g. `npx playwright test tests/orders.spec.ts` or `npx playwright test -g "test name"`.

## food-grandma-fastapi (the active target app)

The backend source is included in `food-grandma-fastapi/`. Commit updates to this reader repository.

```bash
cd food-grandma-fastapi
docker compose up --build      # backend :8081 + internal management service, seeds demo data automatically
# or natively:
pip install -r requirements.txt && uvicorn app.main:app --reload --port 8081
cd ../food-grandma-management && npm install && npm run dev   # internal :5180, proxies /api to :8081

pip install -r requirements.txt -r requirements-test.txt && pytest -v   # backend's own test suite
```

Reset/seed fixture data for E2E runs (matches Django original's fixture values, for cross-target comparability):

```bash
curl -X POST -H "X-Demo-Reset-Key: local-dev-reset-key" http://localhost:8081/api/test/reset
curl -X POST -H "X-Demo-Reset-Key: local-dev-reset-key" http://localhost:8081/api/test/seed
```

Seeded credentials: restaurant `admin`/`password@321`; customer token `e2e-customer-token`; driver token `e2e-driver-token`; order id 1 (`COOKING`, 2× Margherita = $20).

Architecture: `app/routers/{restaurant,customer,driver,social_auth,demo_data}.py` — restaurant dashboard is a bearer-token JSON API (`/api/restaurant/`) consumed by the React SPA in `food-grandma-management/src/pages/`, not server-rendered/cookie-based; customer/driver routes are a separate mobile-style API. Every interactive frontend element carries a `data-testid`. See that project's own README for the full list of intentional deviations from the original Django app (no CSRF, no real file uploads for images, meal edit scoped to owning restaurant, etc.) — those deviations are deliberate, not bugs to fix opportunistically.
