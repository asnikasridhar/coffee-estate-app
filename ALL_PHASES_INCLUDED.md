# All Phases Added

This build expands the previous Phase 1 app into a broader estate system.

## API resources

Generic CRUD endpoints are available under:

- `/api/properties`
- `/api/blocks`
- `/api/labors`
- `/api/vendors`
- `/api/laborVendors`
- `/api/vendorSettlements`
- `/api/wages`
- `/api/wageSettlements`
- `/api/plants`
- `/api/yieldTypes`
- `/api/yieldRates`
- `/api/assets`
- `/api/expenseTypes`
- `/api/expenses`
- `/api/cropDetails`
- `/api/cropIncome`
- `/api/fertilizers`
- `/api/reports`
- `/api/baseUnits`

Special workflow endpoints are still available:

- `/api/attendance`
- `/api/rainfall`
- `/api/yield`
- `/api/dashboard`
- `/api/meta`

## Security basics added/kept

- Helmet headers
- CORS config from env
- JSON body size limit
- Zod validation on key Phase 1 write endpoints
- Parameterized SQLite queries
- Generic resource column allowlists
- Password/photo columns hidden in frontend tables

## What still needs production hardening

Before real public users:

- Add login/session/JWT auth
- Add role-based permissions: owner, manager, labor viewer
- Add audit logs for every update/delete
- Add backup/export flow
- Convert Express API to Cloudflare Pages Functions or Workers for D1
- Add D1 migrations and deployment workflow
