# Finance Regression Test Plan

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
