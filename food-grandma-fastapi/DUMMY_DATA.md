# Food Grandma dummy data

Both `POST /api/test/rebuild` (the web development button) and the legacy
`POST /api/test/seed` rebuild the same complete dataset in a single transaction.
`POST /api/test/reset` remains a cleanup-only endpoint for existing tests.

Every successful rebuild includes:

- Six restaurants, each with a menu and a real stock food photograph.
- 22 meals with photos.
- Orders in Cooking, Ready, On the way, and Delivered states.
- Order details whose subtotals match the order totals.
- A driver assigned to in-transit and delivered orders, including weekly records.

Completeness is validated before commit. Any failure rolls back the entire
replacement. Existing data is preserved on ordinary application restarts;
only an empty database is initialized automatically in demo mode.

Photos are real Unsplash stock photos illustrating food categories, not actual
photographs of these fictional restaurants' dishes. The web labels them accordingly.
