# Finance Regression Test Plan

## Current target: one-screen Work Completion

The operational flow is Attendance → Work Assignment → Work Completion →
Salary Settlement. Completion groups every assignment under its labourer, with
inline actual quantities, automatic units, All shortcuts and Done for fixed work.
There is one Save Work Completion button. Extra work, OT, rate exceptions and
notes are optional actions. Salary shows a compact list for bulk payment;
details hide zero components, and editing is behind Salary exception.

Run:

```powershell
npm test --prefix server
npm test --prefix mobile -- --watch=false
```

New coverage in `test-work-completion.mjs` and `WorkCompletion.test.js`:

- Assigned 2 acres starts with an empty actual and blocks salary payment.
- Actual 1 acre produces wage 120 + work 50 = gross 170; advance 20 leaves 150.
- The assignment stays at 2 acres; salary and snapshots use actual 1 acre.
- Multiple works are grouped under one labour; all 30 labourers have inline inputs.
- All fills the assigned quantity without confirmation or a detail screen.
- Unentered work remains pending; explicit zero is a completed entry worth zero work charges.
- Partial bulk saves preserve unentered rows; numeric and fixed Done entries save together.
- Harvest with no planned quantity shows no assigned-zero label; saved harvest actuals supply the seasonal bonus automatically.
- A single invalid/stale row prevents partial batch writes; concurrent completion changes also block stale salary payment.
- Rate exceptions require reasons and create audit records; OT stays hidden until added.
- Extra work pre-fills its labour and preserves other unsaved quantities.
- Network errors preserve entered actuals for retry.
- Paid completion is locked, and future rates cannot change paid report components.
- Local and Cloudflare payroll GET routes expose the same completion list.
- Salary details contain no harvest entry, no zero components and no Edit links alongside normal rows.

The preceding 25 salary scenarios also remain covered, with test fixtures now
explicitly recording completion before calculating work earnings. Existing paid
snapshots are retained. Earlier tests for entering harvest in Salary Settlement
are superseded by the completion-entry tests above.

Migration 0027 is required before deploying these changes. No assigned quantity
is backfilled as completed. Existing unpaid assignments therefore need completion
confirmation. Android export and Functions compilation are checked locally;
native keyboard/layout behaviour still needs a phone check.

## Salary attachment regression — 21 September 2026

Run the numbered attachment scenarios with:

```powershell
npm run test:salary-scenarios --prefix server
npm test --prefix mobile -- --watch=false
```

`server/scripts/test-salary-scenarios.mjs` exercises the production salary service
through the SQLite/D1 adapter, with real rate, attendance, assignment, input,
advance, override and payment records in an isolated database copy. A test-only
clock permits the attachment's October payment dates. No remote estate data is
modified. All 25 scenarios pass.

| Attachment test | Verified result |
|---|---|
| 1 | Estate daily 100 + fertilization 50 = 150; estimate shows Estate Rate; payment saved |
| 2 | Custom daily 70 + estate weeding 20 = 90 |
| 3 | Custom daily 70 + custom fertilization 2 × 40 = 150 |
| 4 | Custom daily 70 + estate pruning 10 × 15 = 220 |
| 5 | Custom half-day wage = 35 |
| 6 | Estate daily 100 + 2 hours × 100 = 300 |
| 7 | Estate daily 100 + custom OT 2 × 150 = 400 |
| 8 | Seasonal 150 + harvesting 60 + bonus 50 = 260 for 5 bushels |
| 9 | Seasonal 150 + harvesting 60 = 210 for 2 bushels |
| 10 | Exactly 3 bushels qualifies: 260 |
| 11 | 7 bushels earns one flat bonus: 260 |
| 12 | Explicit regular selection persists: October daily 120 |
| 13 | Gross 150 / advance 40 / payable 110; gross is preserved |
| 14 | Work override 50 → 70 with reason produces 190; master remains 50 |
| 15 | Only selected workers paid: 170 + 140; third worker remains unpaid at 260 |
| 16 | September paid report remains 100 + 50 = 150 after future rate changes |
| 17 | Expired daily exception falls back to October seasonal wage 150 |
| 18 | Future daily exception is ignored in October and applies on 1 November at 90 |
| 19 | Work exception start/end dates inclusive; estate fallback immediately outside |
| 20 | Overlapping work exception rejected |
| 21 | Missing Pepper Tying rate marks calculation pending and blocks payment |
| 22 | Two assignments appear separately: 100 + 50 + 40 = 190 |
| 23 | Half-day 50 + work 50 + OT 100 = 200 |
| 24 | Confirmed custom daily wage 70 wins over seasonal 150; seasonal bonus 50 still applies |
| 25 | Combined work/OT/advance/override freezes 350 earned / 50 advance / 300 paid; report and PDF HTML preserve these values after future rates change |

Fixture clarifications: scenarios 17–19 use a separate labour because their
September-only exception conflicts with the September–December exception in
scenario 2. Scenario 25 uses a labour with a work exception and no daily
exception, matching its stated seasonal-wage assumption. Scenario 24 follows
the user's confirmed custom-wage precedence rather than the attachment's
alternative recommendation.

Additional regressions verify that mismatched harvest units are rejected before
overwriting valid saved actuals; the active season's unit is preselected; blank
optional amounts become zero; recalculation refreshes the breakdown and saved
form; errors/pending calculations are visible next to Save; and unsaved actuals
must be recalculated before payment. Shared dropdown tests cover keyboard
dismissal, no automatic search focus, search retained during parent rerenders,
single selection, and closing/reopening.

Validation: all server suites pass; all 28 mobile component tests pass;
Cloudflare Functions compile; DEV Android export succeeds. The PDF assertion
checks the actual HTML passed to Expo Print, not a rendered PDF screenshot.
Native dropdown animation and keyboard layout still require an on-device visual
check; no Android device/emulator was available in this environment.

Release: deploy the API changes and reload/rebuild the mobile app. These fixes
require no new migration beyond 0025 and 0026.

## Automated Tests

Run from the repository root:

```powershell
npm run test:finance --prefix server
```

The test harness creates a SQLite backup in the operating-system temporary directory, points the server at that isolated copy, and removes it after the run. It never mutates the production/source database.

Current automated coverage:

- authenticated, property-scoped Finance setup access;
- rejection of cross-property access;
- Season creation and crop/property validation;
- independent buyer offers below and above market rate;
- Buyer Offer update, delete and persisted primary-key resolution;
- Settlement Cycle create, update and archive;
- archived configuration excluded from the active setup response;
- Market Rate and Buyer Offer do not create revenue;
- Harvest changes stock but does not create revenue;
- confirmed Sale revenue uses actual rate × quantity;
- yield types remain separate stock buckets;
- Wage Rule and Wage Period creation;
- wage reconciliation: earned = advance + settled + outstanding;
- wage finalization creates exactly one authoritative expense;
- repeated finalization is rejected without creating a duplicate expense.

Current result: **1 backend suite / 19 explicit assertions PASS locally** and **1 mobile suite / 1 test PASS locally**. The backend count includes Season edit/archive/hard-delete, measurement-unit and expense-type CRUD, archive/hard-delete paths for Finance setup records, vendor engagement/commission CRUD, and Market Rate yield-type persistence.

Mobile coverage is available with `npm run test:coverage --prefix mobile`. Current FinanceModule coverage is **8.03% statements, 2.46% branches, 4.19% functions and 12.06% lines**. This is component-level coverage only and is not approval evidence for the remaining Finance flows.

The Android bundle check is:

```powershell
cd mobile
$env:EXPO_OFFLINE='1'
npx expo export --platform android
```

## Manual Device Tests

Perform these on a small and a tall Android viewport. Record PASS/FAIL and attach screenshots for failures.

| Flow | Checks |
|---|---|
| Season | Add, edit, archive, dates use calendar, selected Property remains unchanged |
| Wage Rule | Add, edit, archive, persisted rule ID, Season and cycle selection |
| Settlement Cycle | Add, edit, archive, effective dates use calendar |
| Vendor Commission | Add, edit, archive, correct engagement/Season/effective date |
| Expense Type | Add, edit, delete unreferenced record, referenced record gives a clear constraint message |
| Yield Type | Add, edit, archive, Crop → Type → Variety relationship retained |
| Market Rate | Add, edit, archive, Yield Type list filtered by Crop and Variety |
| Buyer | Add, edit, delete unreferenced buyer |
| Buyer Offer | Same buyer can quote below and above market; comparison is correct; edit/archive works |

## Shared dropdown device checks

- Open Vendor and Yield Type selectors near the bottom of a form.
- Confirm the modal remains inside the viewport and above the keyboard.
- Confirm a long list scrolls internally without moving the underlying form.
- Search for an option, select it, reopen the selector and verify it remains selected.
- Tap outside and use Android Back to dismiss.
- Verify the selector on a device with display/font scaling enabled.

Viewport direction and safe-area behavior remain manual checks because unit-level pixel assertions are brittle in React Native.

## Deployed D1 Verification

The shared D1 handlers have syntax and parity checks locally. No deployed endpoint is marked PASS yet.

Safety requirements:

- create and bind a dedicated non-production database such as `coffee-estate-db-test`;
- verify its database ID differs from the production ID before applying migrations;
- use an `[env.test]` Wrangler environment and test-only safe seed records;
- never execute CRUD/regression commands against the production binding;
- keep `CLOUDFLARE_API_TOKEN` in the invoking shell, not in source control.

Provisioning currently requires an authenticated shell:

```powershell
$env:CLOUDFLARE_API_TOKEN = '<token supplied outside source control>'
npx wrangler d1 create coffee-estate-db-test
# Add the returned id only under [env.test] in wrangler.toml, leaving the production block unchanged.
npx wrangler d1 migrations apply coffee-estate-db-test --env test --remote
```

After deploying the test environment, repeat the endpoint matrix and confirm structured `finance_api` entries contain `request_id`, action, entity, property, status and duration without authentication tokens or sensitive labour data. Required behaviors include authentication/property isolation, IDs, archive filtering, validation errors, duplicate-finalization `409`, source idempotency, revenue/stock calculations and wage reconciliation.

## Verification matrix

See `APPLICATION_TEST_CHECKLIST.md` for the concise `Area | Scenario | Automated | Local | D1 | Manual Device | Notes` matrix. D1 remains `NOT STARTED`; manual device cases remain manual. Android bundling is build verification only, not a functional UI test.
