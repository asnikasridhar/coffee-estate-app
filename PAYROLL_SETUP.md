# Labour salary

## Labour exceptions and section help (0026)

The four Set Rates tabs remain unchanged. Daily Wages, Work Rates and Overtime have a secondary Labour Exceptions action. The exception list contains only people with stored exceptions and supports name/ID search, current rates and history. New versions always need From/To dates; no historical record is edited or deleted. No labour-specific seasonal exceptions are created.

Migration `0026_labour_rate_exceptions.sql` adds the optional `labour_rate_exception` table, per-person/per-component overlap protection and immutable-history triggers. The existing bundled `finance_wage_rule` remains the legacy fallback; it is not copied into exception records. Apply 0025 before 0026. Deployment requires the API and mobile bundle updates as well as migrations.

API additions: POST `/api/payroll/labour-exception`, GET `/api/payroll/rate-context`. Existing GET `/api/payroll/rates` now includes exception history and eligible labourers. Assignment estimates accept an optional `labor_id`. All endpoints use the selected property and authenticated user; client-supplied audit usernames are ignored.

The shared resolver uses the work date and resolves each component independently:

1. An active labour daily exception takes priority over seasonal wages (confirmed by the owner).
2. Without a daily exception, use a configured seasonal wage, otherwise the estate daily wage. Selecting regular wages skips the seasonal wage, but still respects a labour exception.
3. Work and OT exceptions affect only their selected type. Other types inherit estate defaults. Expired/future exceptions do not apply.
4. Seasonal bonuses remain estate-wide and independent of daily wage exceptions.
5. Settlement-specific amount overrides and advance deductions apply after rate resolution.

A valid exception can supply a component when an estate default is absent; it does not supply other missing components. Saving an exception identical to defaults throughout its date range is rejected as unnecessary. Paid snapshots preserve the exact exception records and source labels used; subsequent versions do not recalculate them.

Small accessible information buttons explain rate sections, effective periods, history, exceptions and Finance terminology. They open a dismissible explanation without activating the surrounding navigation row. There is no fifth Set Rates tab or change to global navigation.

## Estate-wide Set Rates and Salary Settlement (0025)

Set Rates and Salary Settlement are Home/Modules entries. Finance > Labour Salary contains history and reports. Global navigation and Attendance remain unchanged. Work Assignment shows the rate applicable on the assignment date and an estimated work amount.

- All four rate categories require inclusive From/To dates. Saves append a version; SQL triggers reject overlapping versions within the same estate/category and reject edits/deletes. Use Copy to new date range to create the next version. Existing labour-specific rate records also become immutable.
- Daily wages have explicit full/half amounts. A seasonal wage overrides only the configured component; blank seasonal wages fall back to regular wages. Owners can select regular wages for an unpaid daily record.
- New seasonal rules pay one threshold bonus per day (quantity >= minimum), not repeated groups. This follows the latest specification. Existing legacy bonus modes remain unchanged. Only one seasonal profile may cover an estate/date, avoiding ambiguous precedence.
- Work types reuse `work_activity`; a flat `work` charge applies once per assignment, while `day` follows attendance. Quantity-based charges require the matching Work Assignment unit. Base wages, bonuses, OT and manual adjustments without block attribution appear as Unallocated in cost reports; they are not arbitrarily distributed among blocks.
- Overtime types and rates are estate-specific. Actual quantities, regular/seasonal choice and notes are stored server-side. Manual overrides append original amount, replacement amount, reason, authenticated user ID and timestamp. They never edit a master rate.
- Mark Selected as Paid is atomic for up to 100 workers. Each frozen snapshot contains applicable rate versions, attendance, work rates/quantities/blocks, seasonal bonus, OT/extra, original components, override audit, advances/recoveries and final payable. Duplicate/overlapping payments and shared advance over-recovery are blocked across legacy and new settlements.
- Paid reports read stored snapshots; unpaid totals are explicitly provisional. Historical names and work details come from snapshots. Older period records without detailed snapshots retain saved period totals; missing detail cannot be reconstructed safely. Legacy periods are included by period end date. Crop-season attribution is frozen at payment using the applicable finance season, distinct from seasonal wage profiles.
- Existing labour-specific rates remain a fallback before the estate's first daily rate version. A missing/expired estate daily rate after that date is an error, not a silent fallback. Review historical overtime when moving to typed estate overtime. Existing Settlement Cycle and vendor commission configuration remain available; the new operational payment screen is daily.

Migration `0025_estate_rate_versions.sql` adds estate rate versions, overtime types, daily actuals, override audit, immutable payments/recoveries and integrity triggers. Apply after 0024, before deploying the new API/mobile bundle. It does not recalculate or rewrite existing payments.

Use the tracked runner for remote deployment (after reconciling manually applied migrations):

```powershell
# DEV
npx wrangler d1 migrations apply dev-coffee-estate-db --config wrangler-dev.toml --remote
# STG
npx wrangler d1 migrations apply stg-coffee-estate-db --config wrangler-stg.toml --remote
# Production
npx wrangler d1 migrations apply coffee-estate-db --config wrangler.toml --remote
```

Review `d1 migrations list` first: these commands apply every pending file, including 0024 if still absent. Remote application/deployment is not performed by the implementation task.

Local SQLite (once, from `server`, after a backup):

```powershell
node src/run-migration.js ../migrations/0025_estate_rate_versions.sql
```

Verification includes the 430 earned / 20 advance / 410 payable example, threshold bonuses, inclusive boundaries, missing/expired rates, overlap rejection, June retaining 80 after July changes to 100, authenticated override authors, stale previews, atomic bulk payment conflicts, immutable paid reports, Express/Cloudflare API parity and UI tests.


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
