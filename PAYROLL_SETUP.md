# Labour salary

Open Finance > Labour Salary. Daily entry, Settlement, History and Salary rates use the Attendance module's worker rows, date fields, warm colours and bottom sheets.

## Calculation

- Full-day fixed salary is multiplied by attendance (1, 0.5 or 0).
- Daily extra harvest = max(0, worker harvest - included daily quantity * attendance).
- New salary profiles pay the bonus amount for each completed group of extra harvest; the group size is configurable for each estate/labour profile. Legacy proportional rates retain their calculation until edited. The saved unit must match the rate; kg and bushels are not implicitly converted.
- OT pay = recorded extra hours * hourly OT rate.
- Rates are effective-dated. Each day uses its effective rate; salary rates here are per day.
- Recorded unpaid advance balances up to the cycle end date are recovered oldest first. Recovery never exceeds earnings; the remaining balance carries forward.
- Settling confirms payment of the remaining net salary, including zero when advances cover all earnings. It saves a daily breakdown, recoveries and a single expense for gross earnings atomically.
- Duplicate/overlapping settlement and double advance recovery are blocked. Settled daily salary uses its saved snapshot even if rates or attendance later change.
- Attendance is property-specific. Labour and vendor mappings are owner-wide, matching Labour setup. No legacy propertylabor membership is required.

Worker harvest/OT are entered in Daily entry; estate harvest totals have no worker attribution and cannot automatically be used as salary input. Existing hidden legacy wage-settlement advances are not imported automatically: reconcile any remaining balance before recording it in the new advance ledger.

## Remote migration tracking

Use Wrangler migrations for normal remote releases so successful applications are recorded in `d1_migrations`:

```powershell
npx wrangler d1 migrations list dev-coffee-estate-db --config wrangler-dev.toml --remote
npx wrangler d1 migrations apply dev-coffee-estate-db --config wrangler-dev.toml --remote
```

`d1 execute --file` runs SQL but does not update the migration ledger. The individual-file commands below are manual application examples only. Before switching an existing database to `migrations apply`, reconcile any manually applied migrations against its actual schema; do not rerun migrations with existing `ALTER TABLE ADD COLUMN` changes.

On 2026-09-20, DEV migrations 0022, 0023 and 0024 were verified against all 53 schema objects/columns and required expense codes, then their missing ledger records were added. Their `applied_at` values record reconciliation time, not the original schema application time. Wrangler confirmed no pending DEV migrations. STG and production were not reconciled in this operation.

## Release prerequisite

Apply the additive, idempotent migration before using the new salary endpoints. It does not change existing wage rules or salary records.

Local SQLite, from `server`:

```powershell
node src/run-migration.js ../migrations/0023_labour_payroll.sql
```

Cloudflare D1, from the repository root (run through the normal deployment credentials):

```powershell
npx wrangler d1 execute coffee-estate-db --remote --file migrations/d1/0023_labour_payroll.sql
```

The Pages API deployment alone does not apply this schema. The mobile app must also be rebuilt/reloaded to include PayrollModule. The vendor dropdown fix itself needs no new schema.

## Checks

```powershell
npm test --prefix server
npm test --prefix mobile -- --watch=false
```

Regression tests exercise shared production payroll logic through the local SQLite/D1 adapter and both API routes. Examples: daily fixed 500, 5 units included, 50/extra unit, 100/OT hour => full day + 7 units + 2 OT hours = 800; half day + 3.5 units + 1 OT hour = 400. Combined gross 1200 with advance 1500 means payment 0 and advance 300 carried forward.


## Simple Flow update (0024)

The salary UI follows the supplied reference: white cards and green tab markers; Salary Rates by labour; Daily Entry with No Extra, OT, Harvesting and Other/Custom; auto-calculated saved-day cards; Pay Advance with reasons/recent payments; settlement summary with payment date/mode/amount; and history filtered by labour.

Mapping:

- Attendance supplies full/half/absent status.
- Work Assignment supplies work type and the completed quantity/unit **per labour**. For per-acre, per-tree, kg or bushel rates, fill that quantity in Work Assignment. Missing/mismatched units stop settlement and explain what to correct. Per-day work charges follow attendance and count each work type once per day.
- Salary Rates stores regular wages, optional work-type rates, OT and optional seasonal profiles. Seasonal rates take priority for the selected season within their effective dates. Half-day fixed salary remains half the full-day rate.
- Harvest bonus groups are configurable per labour/property profile: e.g. 600 per 3 bushels in one estate or per 4 in another. New profiles use **completed groups only**. Included harvest allowance is deducted first and is halved on half days; group size itself is not halved. Uncompleted groups do not earn a bonus and do not carry to another day. Existing proportional rates retain their previous behaviour until edited.
- No Extra records zero extras, while still including attendance wages and assigned work charges. OT, harvest and custom extras can also be combined.
- Advance reason and payment date are persisted. Mark as Paid requires the amount to match net payable; the screen does not silently mark a partial payment as fully paid.

Apply migration 0024 **once**, after 0023, before deploying the updated API/mobile app. It adds work quantity fields and salary option tables. Local SQLite has a backup made before application.

DEV (repository root):

```powershell
npx wrangler d1 execute dev-coffee-estate-db --config wrangler-dev.toml --remote --file migrations/d1/0024_salary_simple_flow.sql
```

STG:

```powershell
npx wrangler d1 execute stg-coffee-estate-db --config wrangler-stg.toml --remote --file migrations/d1/0024_salary_simple_flow.sql
```

Production:

```powershell
npx wrangler d1 execute coffee-estate-db --config wrangler.toml --remote --file migrations/d1/0024_salary_simple_flow.sql
```

For a local database that has not received 0024, from `server`:

```powershell
node src/run-migration.js ../migrations/0024_salary_simple_flow.sql
```
