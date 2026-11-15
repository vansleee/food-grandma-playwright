# food-grandma-web

A React + Vite website for Food Grandma customers and drivers, using the `food-grandma-fastapi` backend.

## Why this exists

This website lets customers browse restaurants, order food, and track delivery. Drivers can pick up and deliver orders through the same website, against the `food-grandma-fastapi` backend.

The demo entry offers "Continue as Customer" / "Continue as Driver" buttons using the seeded demo tokens (`e2e-customer-token`, `e2e-driver-token`).

## Screens

- **Customer:** restaurant list → meal menu → cart → checkout (delivery address) → order status / driver tracking.
- **Driver:** ready-to-pick-up orders → pick up → active delivery (update location, mark delivered) → weekly earnings.

## Run it

Backend must be running first (see `food-grandma-fastapi/README.md`):

```bash
cd ../food-grandma-fastapi
docker compose up --build
curl -X POST http://localhost:8081/api/test/reset
curl -X POST http://localhost:8081/api/test/seed
```

Then, natively:

```bash
npm install
npm run dev
```

Or with Docker:

```bash
docker compose up --build
```

Either way it opens at `http://localhost:8082`, proxying `/api` to the backend on `http://localhost:8081` (the Docker build reaches it via `host.docker.internal`, since the backend runs in its own separate `docker compose` project).


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
