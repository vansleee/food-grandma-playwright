# Food Grandma web

React + Vite storefront for customer ordering and driver delivery.

## Structure

- `src/config/brand.ts`: brand name, copy, and hero image.
- `src/components/layout/`: shared header, Grandma logo, footer, and role navigation.
- `src/components/storefront/`: homepage hero and restaurant card.
- `src/components/DeliveryMap.tsx`: delivery map and coordinate validation.
- `src/pages/`: customer and driver workflows.
- `src/services/`: HTTP requests, demo-data rebuilds, and session storage.
- `src/api.ts`: stable facade for existing page imports.
- `src/styles/`: base tokens and controls, storefront layout, delivery layout.
- `src/styles.css`: stylesheet entry point; preserve import order.

## Compatibility

Existing routes, API endpoints, and `data-testid` identifiers remain supported.
Local-storage keys intentionally retain the `food_alpaca_` prefix so existing
sessions and carts continue working after the Food Grandma rename.

The demo rebuild button is controlled by `/api/test/config`. It calls the atomic
`/api/test/rebuild` endpoint and clears the cart only after a successful response.
Do not reset the database to verify a visual or structural frontend change.

## Development

Run the backend on port 8081, then `npm ci` and `npm run dev` (port 8082).
`npm run build` runs TypeScript checking and creates the production bundle.
`docker compose up -d --build` updates the web container only.
