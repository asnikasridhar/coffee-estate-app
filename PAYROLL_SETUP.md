# Labour salary

Open Finance > Labour Salary. Daily entry, Settlement, History and Salary rates use the Attendance module's worker rows, date fields, warm colours and bottom sheets.

## Calculation

- Full-day fixed salary is multiplied by attendance (1, 0.5 or 0).
- Daily extra harvest = max(0, worker harvest - included daily quantity * attendance).
- Extra harvest is multiplied by the per-unit rate. The saved unit must match the rate; kg and bushels are not implicitly converted.
- OT pay = recorded extra hours * hourly OT rate.
- Rates are effective-dated. Each day uses its effective rate; salary rates here are per day.
- Recorded unpaid advance balances up to the cycle end date are recovered oldest first. Recovery never exceeds earnings; the remaining balance carries forward.
- Settling confirms payment of the remaining net salary, including zero when advances cover all earnings. It saves a daily breakdown, recoveries and a single expense for gross earnings atomically.
- Duplicate/overlapping settlement and double advance recovery are blocked. Settled daily salary uses its saved snapshot even if rates or attendance later change.
- Attendance is property-specific. Labour and vendor mappings are owner-wide, matching Labour setup. No legacy propertylabor membership is required.

Worker harvest/OT are entered in Daily entry; estate harvest totals have no worker attribution and cannot automatically be used as salary input. Existing hidden legacy wage-settlement advances are not imported automatically: reconcile any remaining balance before recording it in the new advance ledger.

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
