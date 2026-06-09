# Coffee Estate App - All Phases Local Build

This is a full local-testable estate management app using:

- React + Redux Toolkit + hooks frontend
- Express API backend
- SQLite local database using `better-sqlite3`
- Migration/seed SQL included in `migrations/001_schema_seed.sql`
- Cloudflare D1-compatible schema path for later deployment

## Run locally

```bash
npm run install:all
npm run seed
npm run dev
```

Open:

```txt
http://localhost:5173
```

Backend:

```txt
http://localhost:8787/api/health
http://localhost:8787/api/dashboard
http://localhost:8787/api/meta
```

## Modules included

### Phase 1
- Labor attendance
- Labor cost dashboard
- Rainfall entry
- Yield settlement entry

### Phase 2
- Estate properties
- Blocks and sub-blocks
- Plant details
- Base units
- Employees / labors
- Vendors
- Labor vendor mapping

### Phase 3
- Wage settings
- Running wage settlements
- Labor vendor settlements
- Yield types
- Yield rates / market price
- Fertilizer application

### Phase 4
- Expense types
- Running expenses
- Crop details
- Crop income / revenue
- Inventory / current assets
- Reports
- Profit estimate dashboard

## Image locations

Use this for imported React assets:

```txt
client/src/assets/estate-images/
```

Use this for direct URL access:

```txt
client/public/estate-images/
```

## Important local DB note

The backend prints the SQLite file being used:

```txt
Using SQLite DB: ...server/data/coffee-estate.sqlite
```

If you change schema, stop the backend, delete this file, and run:

```bash
npm run seed
```

## Cloudflare direction

The app is local Express + SQLite for easy testing. For Cloudflare Pages/D1, keep the React app and move API routes to Pages Functions or Workers, replacing `better-sqlite3` calls with D1 prepared statements.
