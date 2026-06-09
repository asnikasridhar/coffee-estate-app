# Plant Inventory Enhancement - Safe Patch

This patch is based on your uploaded reference app. It does **not** replace images, existing tooltip styles, login, property dropdown, or old routes. It only overwrites the files listed in this package and adds a new plant inventory module.

## What is added

- Plant Inventory CRUD under `Estate Setup -> Plant Inventory by Block/Sub-block`
- Add / Edit / Delete / View plant inventory records
- Property-scoped plant inventory
- Block + optional sub-block/section tracking
- Dashboard:
  - Plant count KPI
  - Plants by block pie chart
  - Plants by sub-block pie chart
  - Plants by type pie chart
- Pie chart hover tooltip shows plant count and percentage
- Local Express support
- Cloudflare Pages Functions support
- SQLite/D1 migration: `migrations/0010_plant_inventory.sql`

## Files to copy

Copy these folders/files into your existing repo root:

- `client/src/main.tsx`
- `client/src/features/appSlice.ts`
- `client/src/styles.css`
- `server/src/config/resources.js`
- `server/src/routes/dashboard.routes.js`
- `functions/_shared/crud.js`
- `functions/api/dashboard.js`
- `functions/api/[resource]/[id].js`
- `functions/api/resources/[resource]/[id].js`
- `migrations/0010_plant_inventory.sql`

## Local DB apply

From project root:

```bash
cd server
node -e "import('./src/db.js').then(({db})=>{const fs=require('fs'); db.exec(fs.readFileSync('../migrations/0010_plant_inventory.sql','utf8')); console.log('plant inventory migration applied')})"
npm run dev
```

In another terminal:

```bash
cd client
npm run dev
```

## Cloudflare D1 apply

```bash
npx wrangler d1 execute coffee-estate-db --remote --file=./migrations/0010_plant_inventory.sql
git add .
git commit -m "Add plant inventory CRUD and dashboard charts"
git push origin main
```

## Test APIs

Local:

```txt
http://localhost:8787/api/plantInventory
http://localhost:8787/api/dashboard
```

Cloudflare:

```txt
https://coffee-estate-app.pages.dev/api/plantInventory
https://coffee-estate-app.pages.dev/api/dashboard
```

The frontend sends `x-property-id` automatically from the selected property.
