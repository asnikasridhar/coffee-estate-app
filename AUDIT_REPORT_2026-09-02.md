# JavaTerrain / Estate Manager Inspection & Read-Only Audit

Date: 2 September 2026
Branch inspected: `develop-mobile`
Data source inspected: `backup_coffee_estate_db_Sept_2_2026.sql`
Scope: code, schema, API, UI architecture, calculations, security, and read-only data integrity. No cleanup was executed.

## Executive decision

Modernization is feasible without rewriting Attendance, Rain, or Work Assignment. Those modules already have custom flows and must remain visually frozen. The recommended work is a staged extraction of shared design components, a management-oriented dashboard, and List -> Detail -> Add/Edit flows for Plant Inventory, Property/Blocks, Labour/Vendor, Fertilizer, and Expenses.

Implementation should not begin with visual work alone. Authentication and record-level authorization are currently unsafe for production, duplicate attendance can inflate wages/reports, and fertilizer multi-table saves are orchestrated by the mobile client rather than an atomic server operation.

## Risk summary

| Severity | Finding | Effect |
|---|---|---|
| Critical | API identity is taken from caller-controlled `X-User-Id`; returned demo tokens are not validated | Account/property impersonation and IDOR risk |
| Critical | Plaintext passwords and universal fallback password logic | Account compromise risk |
| Critical | Staged SQL backup contains plaintext credentials and personal data | Must not be committed or published as-is |
| High | Generic PATCH/DELETE does not prove target record ownership | Cross-property record mutation/deletion may be possible |
| High | Fertilizer purchase/application/ledger/expense writes are not server-side atomic | Partial saves can corrupt stock and expenses |
| High | Nine duplicate attendance groups (20 rows) exist | Wage, labour-day and report inflation |
| High | Dashboard property-profit join can multiply income and expense rows | Incorrect financial totals |
| Medium | Labour, vendor, wage and mapping resources are globally listed | Cross-owner privacy/isolation risk |
| Medium | Raw database error messages are returned to clients | Internal schema/SQL disclosure |
| Medium | Hard-coded WeatherAPI key and unrestricted CORS | Secret abuse and overly broad API exposure |
| Medium | Most resources load up to 500 rows on every property refresh | Performance and mobile data-usage risk |

## A. Existing frontend structure

### Mobile

- React Native + Expo application.
- The majority of the application is in one large `mobile/App.js` file.
- Navigation is local state (`home`, `add`, `modules`, `reports`, `more`, `module`) with a custom history stack rather than React Navigation.
- `loadAll()` fetches dashboard/meta/attendance/rain/yield and then every configured resource whenever the selected property changes.
- `FertilizerManagement.js` is the first substantial module extracted to a separate file.
- Attendance, Rain, and Work Assignment are already purpose-built components inside `App.js`.

### Web

- React + Redux Toolkit + Vite.
- Main UI remains concentrated in `client/src/main.tsx`.
- Generic resource forms and tables are widely reused.
- Web and mobile call the same `/api` surface but have independent UI implementations.

## B. Existing backend/API structure

There are two implementations that must stay behaviourally aligned:

1. Cloudflare Pages Functions under `functions/api` using D1.
2. Local Node/Express under `server/src` using `better-sqlite3`.

Both use:

- dedicated routes for authentication, dashboard, attendance, rainfall and yield;
- generic CRUD configuration for most resources;
- user/property context derived from request headers/query parameters;
- parameterized SQL for values, while generic table/order names come from server-owned configuration.

The deployed Cloudflare implementation is the production priority.

## C. Existing database tables

The inspected backup contains 38 application tables. Main groups:

- Identity/access: `users`, `propertyuser`
- Property: `property`, `blocks`
- Labour/vendor: `labors`, `propertylabor`, `vendor`, `laborvendor`, `wage`, settlements
- Attendance/work: `attendance`, `work_activity`, `work_assignment`
- Crop/plant: `crop_master`, `crop_type_master`, `variety_master`, `plant_inventory`, legacy `plantdetails`, `cropdetails`
- Weather/yield: `raindetails`, `yieldtype`, `yieldrate`, `yield_settlement`
- Finance: `expensetype`, `running_expenses`, `crop_income`, `reports`
- Fertilizer: legacy `fertilizers`, plus `fertilizer_master`, `fertilizer_purchase`, `fertilizer_application`, `fertilizer_adjustment`, `fertilizer_stock_movement`
- Configuration/assets: `baseunit`, `currentasset`

The new fertilizer tables exist in the backup but contain zero records. The legacy fertilizer table contains two records.

## D. Existing reusable UI components

Mobile reusable pieces include:

- `Section`
- `FieldText`
- `SmartField`
- `DateRangeFilter`
- `Pagination`
- `RecordList`
- `PropertyBar`
- `BottomNav`
- `CatalogDirectoryScreen`
- Labour and Vendor directory components

The components are reusable but live in `App.js`; this makes controlled modernization difficult. They should be extracted gradually, not duplicated.

## E. Existing design/theme implementation

- Brown constants already exist: `GREEN` currently holds brown `#8a5527`, alongside `DARK`, `SOFT`, and `LINE`.
- Many styles still contain inline green, blue, and duplicated overrides.
- The stylesheet defines some keys more than once; later keys silently override earlier values.
- Emoji are the current icon system. No Expo vector-icon package is declared directly in `mobile/package.json`.
- No custom Poppins font is configured. The native system font should remain until typography can be standardized without adding build risk.

Recommendation: introduce `mobile/src/theme/tokens.js`, `typography.js`, and one icon adapter based on an Expo-compatible icon package already transitively available or deliberately added after build verification.

## F. Frozen modules

The following existing component flows will remain visually and structurally untouched:

- `AttendanceGrid` in `mobile/App.js`
- `RainfallScreen` in `mobile/App.js`
- `WorkAssignmentScreen` in `mobile/App.js`

Permitted changes are limited to correctness, authorization, atomic integration, loading/error handling, and genuine bugs. Work Assignment date/property placement remains unchanged.

## G. Current Plant Inventory flow

`PlantInventoryHierarchyScreen` holds form state, dependent Crop -> Type -> Variety selectors, save/edit/delete logic, and the saved inventory list in one component. After save it calls `reload()`, clears the form, and remains on the same screen, where records are rendered beneath the form. This directly causes the reported long, cluttered screen.

Recommended split:

- `PlantInventoryListScreen`
- `PlantInventoryDetailScreen`
- `PlantInventoryFormScreen`
- shared dependent hierarchy selector

The current API stores `variety_master_id`, which is correct. Crop and type should be resolved through relationships rather than duplicated into inventory.

## H. Current Home dashboard data source

Mobile `loadAll()` calls `/api/dashboard`; Cloudflare calculates dashboard values in `functions/api/dashboard.js`, with a parallel Node implementation in `server/src/routes/dashboard.routes.js`.

Current dashboard calculations include attendance, labour cost, rainfall, yield value, expenses, income, assets, profit, plant totals and work assignment counts. The mobile Home then combines dashboard data with fully loaded module resources and weather data.

Risks:

- default ranges can span up to a year rather than purpose-built today/month ranges;
- the property-profit query joins income and expenses in one aggregate and can multiply rows when both sides contain multiple records;
- fertilizer KPIs/alerts are not yet included server-side;
- loading all resources for Home is unnecessarily expensive.

## I. Existing icon library

There is no consistent functional icon library in active use. The mobile UI primarily uses emoji, including repeated plant/coffee symbols. Category icons should be moved behind one adapter so screens do not import mixed icon families.

## J. Existing role/authentication implementation

- Database roles exist, primarily `owner`; guest/viewer is hard-coded in login.
- Cloudflare returns a predictable demo token but does not validate it on later requests.
- APIs trust `X-User-Id`, query `user_id`, or default to user 1.
- Node behaves similarly and permits missing identity on some routes.
- No session expiry, token signature verification, logout invalidation, or rate limiting is present.
- Three of five users in the inspected backup have plaintext passwords.
- Hash-looking passwords accept a shared fallback password rather than bcrypt verification.
- Mobile does not persist the returned token and sends only numeric user/property headers.

Conclusion: UI role labels exist, but production-grade authentication/authorization does not.

## K. Current calculation locations

### Attendance and wages

- Attendance values are stored directly in `attendance.attendance_value`.
- Labour cost is calculated in dashboard/attendance SQL as `attendance_value * (wage_fixed + wage_variable)`.
- There is no robust hourly calculation using recorded hours.
- Multiple wage rows for one labour can multiply joins unless constrained/selected explicitly.

### Vendor commission

- `laborvendor.vendor_labor_percentage` is stored and checked between 0 and 100.
- Mobile vendor cards infer/display commission from current mapping data.
- Per-day, half-day, hourly, per-unit, and historical snapshot calculation engines are not implemented.

### Fertilizer stock

- Mobile currently calculates balance from `fertilizer_stock_movement` rows.
- Unit conversion is also performed in the mobile component.
- Purchase/application/adjustment and movement records are saved through sequential client API calls.
- This business logic belongs in transactional server endpoints.

### Expenses

- Source of truth is `running_expenses.other_expense`.
- Fertilizer purchase can create/link an expense, but synchronization is client-orchestrated.
- Payment/supplier/source metadata is mainly held on fertilizer purchase, not a general expense-detail model.

### Reports/profit

- Dashboard SQL derives income, expense, labour cost and yield value.
- A separate editable `reports` table also exists, creating ambiguity between computed and manually entered reports.
- Profit currently subtracts both running expenses and calculated labour cost. If wage expense is later written to `running_expenses`, it could be double-counted unless source types are explicit.

## L. Data-integrity findings

### Read-only backup counts

- Properties: 5
- Blocks: 10
- Labourers: 18
- Vendors: 2
- Attendance: 90
- Work assignments: 24
- Plant inventory: 8
- Expenses: 1
- New fertilizer master/purchase/application/movement records: 0

### Suspicious records requiring review

| Table | IDs | Finding | References | Recommendation |
|---|---|---|---|---|
| `property` | 1, 4 | Same normalized name “Manjushree” for same owner | ID 1: 10 blocks, 87 attendance, 24 work, 1 expense, 8 inventory. ID 4: no checked transactions | Manual review; likely KEEP 1 and archive/delete 4 only after confirmation |
| `crop_type_master` | 1, 4 | Same crop and normalized type “Arabica” | ID 1 has 1 variety; ID 4 has 2 varieties; different block IDs | MERGE only after mapping varieties and validating historical intent |
| `labors` | 5, 6, 7 | Same normalized name “Test Lab 3” | All have history; ID 7 also has vendor and wage relationships | Manual review/MERGE; never delete solely by name |
| `attendance` | 20 rows across 9 groups | Multiple records for same property/labour/date | IDs listed below | Review values/timestamps, retain correct daily record, archive audit trail, then add uniqueness protection |
| `plant_inventory` | 7 | Sub-block value `aq` appears suspicious | Has 10 plants | Manual review, not automatic deletion |

Duplicate attendance groups:

- Property 1, labour 1, 2025-09-01: IDs 1, 3, 9
- Property 1, labour 11, 2025-09-01: IDs 2, 5, 12
- Property 1, labour 12, 2025-09-01: IDs 7, 15
- Property 1, labour 1, 2025-09-02: IDs 4, 10
- Property 1, labour 11, 2025-09-02: IDs 6, 13
- Property 1, labour 12, 2025-09-02: IDs 8, 16
- Property 1, labour 2, 2026-06-09: IDs 18, 19
- Property 1, labour 13, 2026-06-11: IDs 20, 21, 22, 23
- Property 1, labour 3, 2026-08-22: IDs 31, 34

### Checks that passed in this backup

The read-only queries found zero:

- blocks missing properties;
- parent blocks belonging to another property;
- orphan property-labour mappings;
- attendance rows missing labour/property;
- work assignments missing core relations;
- work assignments linked to blocks from another property;
- inventory rows missing property/block/variety relations;
- inventory rows linked to blocks from another property;
- attendance values outside 0–2;
- negative wage components;
- commission percentages outside 0–100;
- exact duplicate Work Assignment groups under the tested key.

These results do not prove full integrity; nullable relationships, semantic duplicates, historical rate correctness, and deployed data after the backup still require verification.

## M. Security findings

1. **Caller-controlled identity:** `userIdFromRequest()` trusts headers/query values and defaults to user 1.
2. **No token enforcement:** login tokens are predictable/demo values and ignored after login.
3. **Unsafe password verification:** plaintext comparison and shared fallback password.
4. **Credential exposure:** the staged SQL backup contains plaintext credentials and emails.
5. **Generic record IDOR:** PATCH/DELETE checks the selected property header but does not scope the target row in the SQL `WHERE` clause.
6. **Global sensitive resources:** labour/vendor/wage/mapping endpoints can return all owners’ records.
7. **Raw errors:** Cloudflare `fail()` returns database error messages and context.
8. **CORS:** `Access-Control-Allow-Origin: *` applies to the API.
9. **Hard-coded secret:** WeatherAPI key has a source-code fallback in mobile.
10. **No rate limiting:** login and mutation routes have no abuse protection.
11. **Sensitive UI data:** government ID/bank fields exist; masking is inconsistent.
12. **Demo credentials:** web/mobile login screens prefill or document credentials.

## N. Exact files proposed for modification

### Phase 2: shared mobile design system

- `mobile/App.js` — adopt shared tokens/components without changing frozen module layout
- `mobile/FertilizerManagement.js` — adopt shared components and remove client business calculations
- New `mobile/src/theme/tokens.js`
- New `mobile/src/theme/typography.js`
- New `mobile/src/components/AppIcon.js`
- New `mobile/src/components/ScreenHeader.js`
- New `mobile/src/components/StateView.js`
- New `mobile/src/components/EntityList.js`
- New `mobile/src/components/StatusBadge.js`
- New `mobile/src/components/FormSection.js`

### Dashboard and module screens

- New `mobile/src/screens/HomeDashboardScreen.js`
- New Plant Inventory list/detail/form files under `mobile/src/screens/plant-inventory/`
- New Property/Block screens under `mobile/src/screens/properties/`
- Extract existing Labour/Vendor screens under `mobile/src/screens/people/` without duplicating logic
- New Expense overview/list/detail/form files under `mobile/src/screens/expenses/`
- Refine fertilizer screens under `mobile/src/screens/fertilizer/`

### Cloudflare production API

- `functions/_shared/http.js`
- `functions/_shared/crud.js`
- `functions/api/auth/login.js`
- `functions/api/dashboard.js`
- `functions/api/meta.js`
- `functions/api/owner/me.js`
- `functions/api/owner/properties.js`
- `functions/api/[resource].js`
- `functions/api/[resource]/[id].js`
- New authenticated fertilizer transaction endpoints under `functions/api/fertilizer/`
- New expense overview/detail endpoints under `functions/api/expenses/`

### Node parity

- `server/src/app.js`
- `server/src/middleware/context.js`
- `server/src/config/resources.js`
- `server/src/routes/auth.routes.js`
- `server/src/routes/crud.routes.js`
- `server/src/routes/dashboard.routes.js`
- New fertilizer/expense route files matching production behaviour

### Web compatibility

- `client/src/features/appSlice.ts`
- `client/src/main.tsx`
- `client/src/styles.css`

Attendance, Rain, and Work Assignment component markup will not be changed for design consistency.

## O. Exact migrations proposed

No migration will be executed before approval and data cleanup review.

1. `0018_security_and_archival.sql`
   - add `archived_on`, `archived_by`, and/or status fields only to entities that currently require safe deactivation;
   - add authentication/session support only if the selected signed-token design requires persistent refresh/revocation records;
   - do not store plaintext credentials.

2. `0019_plant_inventory_operational_fields.sql`
   - add nullable `area_covered`, `area_unit_id`, `productive_count`, `non_productive_count`, and `dead_count`;
   - checks ensuring counts are non-negative and component counts do not exceed total plants where enforceable;
   - retain `variety_master_id` as the hierarchy reference.

3. `0020_expense_source_and_payment.sql`
   - add structured description, supplier/vendor reference, payment mode/status, notes, source type/source ID, and suitable indexes;
   - enforce one linked expense per source record where appropriate.

4. `0021_vendor_commission_history.sql`
   - structured commission type/rate;
   - effective dates and immutable transaction snapshots so historical totals do not change with current defaults.

5. `0022_integrity_constraints_after_cleanup.sql`
   - applied only after duplicate review/cleanup;
   - unique attendance key for the agreed business rule;
   - hierarchy/property indexes and constraints supported by SQLite/D1;
   - targeted uniqueness for masters using normalized values where practical.

6. `0023_fertilizer_transaction_hardening.sql` only if inspection during implementation identifies missing ledger constraints; no duplicate fertilizer tables.

## Recommended implementation gates

### Gate 1 — approve safety work first

- Replace authentication and caller-supplied identity.
- Scope every record lookup/mutation to authenticated ownership.
- Remove raw errors, hard-coded secrets, demo credentials and unrestricted sensitive listings.
- Add server-side validation and transactional fertilizer endpoints.

### Gate 2 — approve UI modernization

- Central brown design system and functional icons.
- Management dashboard.
- Plant Inventory List -> Detail -> Add/Edit.
- Then Property/Blocks, Labour/Vendor, Fertilizer and Expense.

### Gate 3 — approve data cleanup separately

- Review every suspicious row above.
- Decide KEEP/MERGE/ARCHIVE/DELETE TEST DATA.
- Execute against a fresh backup transactionally.
- Re-run the full audit and reconcile reports.

## Approval requested

Recommended approval scope:

1. Phase 1A security and transaction hardening.
2. Phase 2 shared brown design system.
3. Phase 3 dashboard redesign.
4. Phase 4 Plant Inventory redesign.
5. No destructive data cleanup yet.

Attendance, Rain, and Work Assignment remain frozen except for verified correctness/security defects.
