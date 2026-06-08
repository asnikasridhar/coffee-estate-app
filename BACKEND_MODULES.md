# Backend module layout

The server is now split by UI/business area instead of keeping all API logic in `server/src/index.js`.

```txt
server/src/
  index.js                 # starts the server only
  app.js                   # Express app, middleware, route registration
  db.js                    # SQLite connection and helpers
  seed.js                  # loads migrations/schema.sql and migrations/seed.sql
  config/resources.js      # generic CRUD resource map
  middleware/context.js    # owner and property-scope checks
  utils/dateRange.js       # one-year dashboard range clamp
  utils/asyncHandler.js
  utils/pick.js
  routes/
    auth.routes.js         # login
    owner.routes.js        # owner properties and registration
    meta.routes.js         # dropdown/meta data
    dashboard.routes.js    # dashboard metrics and date filters
    attendance.routes.js
    rainfall.routes.js
    yield.routes.js
    crud.routes.js         # remaining UI modules: blocks, vendors, wages, assets, expenses, etc.
```

Database files included:

```txt
migrations/schema.sql      # tables, indexes, FK definitions
migrations/seed.sql        # sample data inserts
migrations/001_schema_seed.sql # combined legacy migration kept for reference
```

Use `npm run seed` from project root. You no longer need the `sqlite3` command-line tool.
