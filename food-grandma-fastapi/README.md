# Food Grandma — FastAPI + React rewrite

Food Grandma provides customer ordering, driver delivery, and restaurant management through a FastAPI JSON API and React web applications.

Backend runs on **port 8081**; the web entry runs on **port 8082**, with restaurant management available at `/management/`.

## Run

With Docker (backend + frontend, both services):

```bash
docker compose up --build
```

Starts two services: `backend` (FastAPI, port **8081**) and `management`
(nginx serving the built React SPA from `../food-grandma-management/` —
a sibling folder in this repository
— internal port **80**, available through web `/management/`, proxying `/api` to `backend:8081`). Creates tables and seeds demo data automatically
(`SEED_DEMO_DATA=true` in `docker-compose.yml`). SQLite data persists in the
`sqlite-data` volume; `docker compose down -v` wipes it.

Or run each half natively:

Backend:

```bash
pip install -r requirements.txt
DEMO_RESET_KEY=local-dev-reset-key uvicorn app.main:app --reload --port 8081
```

Frontend (separate terminal, hot reload):

```bash
cd ../food-grandma-management
npm install
npm run dev   # http://localhost:8082/management/, proxies /api to :8081
```

## Seed / reset fixture data

HTTP endpoints (matches `practice-app`'s `/api/test/reset` + `/api/test/seed`
convention):

```bash
curl -X POST -H "X-Demo-Reset-Key: local-dev-reset-key" http://localhost:8081/api/test/reset
curl -X POST -H "X-Demo-Reset-Key: local-dev-reset-key" http://localhost:8081/api/test/seed
```

Seeds the **same values** as the Django app's `seed_demo_data`, so fixture
data lines up across both targets:

| What | Value |
|---|---|
| Restaurant login (dashboard) | `admin` / `password@321` |
| Customer access token | `e2e-customer-token` |
| Driver access token | `e2e-driver-token` |
| Seeded order | id 1, COOKING, 2× Margherita = $20, customer "Cathy Customer" |

## Surfaces to test

- **Restaurant dashboard** — React SPA (`../food-grandma-management/`, at the parent repo's root) talking to a JSON API (`app/routers/restaurant.py`) under `/api/restaurant/`, bearer-token auth (`Authorization: Bearer <token>`, obtained from `POST /api/social/token/`). Pages: sign in/up, orders (status button Cooking→Ready — driver app owns Ready→OnTheWay→Delivered, same split as Django), meals, report, account. Every interactive element carries a `data-testid` (Django's original templates have none).
- **Customer/driver REST API** (`access_token` query/form param, mobile-app style — unchanged from the original build): see `app/routers/customer.py` / `driver.py` — same paths, params, and business rules as the Django version's `apis.py` (verified against its `test_apis.py`).
- **API docs**: FastAPI gives you `/docs` (Swagger UI) and `/redoc` for free — lists every `/api/*` route including the restaurant dashboard's.

## Intentional deviations from the Django version

- `Meal.image` / `Restaurant.logo` are plain URL strings, not real file uploads — the Django app's Cloudinary keys were always placeholders and its own fixtures just pass a string, so no functional loss.
- The restaurant dashboard is a token-authenticated JSON API + separate React SPA, not server-rendered HTML with cookie sessions — a deliberate architecture choice (see `automation/README.md`'s target table), reusing the same bearer-token mechanism as the customer/driver mobile API instead of introducing session cookies.
- `/api/social/token/` issues an access token from username+password directly for *all* roles (restaurant included), skipping `django-oauth-toolkit`'s full OAuth2 grant flow — Django's own test suite never exercises that flow either (its fixture creates `AccessToken` rows straight via the ORM).
- Meal edit/update is scoped to the logged-in restaurant's own meals; Django's version has no ownership check.
- No CSRF protection — moot once the dashboard is bearer-token JSON rather than cookie-authenticated.

## Tests

```bash
pip install -r requirements.txt -r requirements-test.txt
pytest -v
```

`tests/` covers the Django suite's business-rule parity (`test_apis.py`'s 13
customer/driver cases, ported to `tests/test_apis.py`) plus the restaurant
JSON API (`tests/test_restaurant_api.py`) and a handful of model checks —
same fixture names/values as the Django `conftest.py` where practical, not a
mechanical 1:1 port of all 31 cases. The React frontend has no test suite of
its own yet (`npm run build` / `tsc -b` at least type-checks it) — that's the
next Playwright-harness step per `automation/README.md`'s workflow.


## Unified local URLs

- FastAPI: http://localhost:8081 (API docs: `/docs`).
- Web: http://localhost:8082.
- Management: http://localhost:8082/management/ (web header: 管理後台).

Start `docker compose up -d --build` in `food-grandma-fastapi` first, then in
`food-grandma-web`. Both compose projects share `food-grandma-network`; management
is internal to that network and does not publish a host port. SQLite data remains
in the existing named volume.

For native development, start FastAPI on 8081, management Vite on its internal
5180 port, and web Vite on 8082. Open web 8082; its `/management/` and `/api/`
proxies forward to the corresponding development servers.
