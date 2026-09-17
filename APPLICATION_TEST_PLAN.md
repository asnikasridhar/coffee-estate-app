# JavaTerrain Application Test Plan

## Test layers

1. **Backend integration:** isolated SQLite backup; API authentication, validation, property isolation, persistence, calculations, archival and idempotency.
2. **Mobile component/integration:** Jest with `jest-expo` and React Native Testing Library, pinned to Expo SDK 54 / React Native 0.81 without framework upgrades.
3. **Deployed D1 verification:** dedicated non-production D1 binding only. Production data and bindings are never used for regression writes.
4. **Manual device regression:** Android viewport, keyboard, safe-area, calendar and pixel-position behavior that is unreliable in renderer tests.
5. **Build verification:** Android bundle/export proves bundling only; it is not evidence that forms, dropdowns, Edit/Delete or navigation work.

## Commands

```powershell
npm run test:finance --prefix server
npm test --prefix mobile -- --coverage=false
npm run test:coverage --prefix mobile
```

The server harness works on a disposable backup in the operating-system temporary directory and removes it when finished.

## D1 safety gate

D1 verification may run only after `wrangler.toml` contains a dedicated `[env.test]` binding whose database ID differs from production. Set `CLOUDFLARE_API_TOKEN` in the invoking shell; never store it in this repository. Provisioning and remote verification are currently blocked until that environment credential is available.

Required deployed matrix: authentication, property isolation, CRUD IDs, validation errors, active/archive filtering, duplicate finalization `409`, fertilizer/wage/vendor source idempotency, sale revenue/reversal, wage reconciliation, summary reconciliation, and structured `finance_api` request-correlation logs.
