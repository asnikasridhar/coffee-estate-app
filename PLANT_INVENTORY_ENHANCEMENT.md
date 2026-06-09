# Plant Inventory Enhancement

## What was added

- New `plant_inventory` table with property, block, optional sub-block, plant type, count, planting date, and notes.
- Local Express APIs:
  - `GET /api/plantInventory`
  - `GET /api/plantInventory/summary`
  - `POST /api/plantInventory`
  - `PATCH /api/plantInventory/:id`
  - `DELETE /api/plantInventory/:id`
  - Alias: `/api/plant-inventory`
- Cloudflare Pages Functions:
  - `functions/api/plantInventory/index.js`
  - `functions/api/plantInventory/[id].js`
  - Alias folder: `functions/api/plant-inventory/`
- Frontend menu item: `Plant Inventory`
- CRUD support for plant inventory including add, edit, delete, and table view.
- Dashboard cards and charts:
  - Total plants
  - Plant distribution by block
  - Plant distribution by plant type
  - Plant count by block/sub-block

## Local setup

From the project root:

```bash
npm run install:all
npm run seed
npm run dev
```

Open:

```txt
http://localhost:5173
```

Login:

```txt
Username: Asnika Sridhar
Password: owner123
```

## Applying only the DB migration locally

If you already have an existing local DB and do not want to fully reseed, run the SQL from:

```txt
migrations/0009_plant_inventory.sql
migrations/0009_plant_inventory_seed.sql
```

If you cannot run `sqlite3`, easiest is to delete the local DB and reseed:

```bash
rm server/data/coffee-estate.sqlite
npm run seed
```

On Windows PowerShell:

```powershell
Remove-Item server\data\coffee-estate.sqlite
npm run seed
```

## Cloudflare D1 steps

Apply migration:

```bash
npx wrangler d1 execute coffee-estate-db --remote --file=./migrations/0009_plant_inventory.sql
```

Optional sample data:

```bash
npx wrangler d1 execute coffee-estate-db --remote --file=./migrations/0009_plant_inventory_seed.sql
```

Push functions and frontend:

```bash
git add .
git commit -m "Add plant inventory CRUD and dashboard charts"
git push origin main
```

## Cloudflare test URLs

Replace domain if your Pages domain is different.

```txt
https://coffee-estate-app.pages.dev/api/plantInventory?property_id=1&user_id=1
https://coffee-estate-app.pages.dev/api/dashboard?property_id=1&user_id=1
```

## Notes

- Plant inventory is property scoped. A block must belong to the selected property.
- Sub-block is stored as text for now. Later it can become a separate `sub_blocks` table if you need strict management.
- The dashboard charts use lightweight CSS pie charts, so no extra chart library is required.
