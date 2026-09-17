# JavaTerrain Verification Checklist

Status values are `PASS`, `FAIL`, `PARTIAL`, and `NOT STARTED`. A build success does not change a functional row to PASS.

| Area | Scenario | Automated | Local | D1 | Manual device | Notes |
|---|---|---:|---|---|---:|---|
| Finance API | Authentication and property isolation | Yes | PASS | NOT STARTED | No | Cross-property request rejected locally |
| Finance Setup | Season create/edit/archive/hard delete and calendar controls | Partial | PASS | NOT STARTED | Yes | API lifecycle automated; calendar interaction remains a device check |
| Finance Setup | Wage Rule CRUD/archive | Partial | PARTIAL | NOT STARTED | Yes | Creation/finalization covered; edit/archive UI automation pending |
| Finance Setup | Settlement Cycle CRUD/archive | Yes | PASS | NOT STARTED | Yes | API create/edit/archive and active-list exclusion covered |
| Finance Setup | Vendor Commission CRUD and settlement | No | NOT STARTED | NOT STARTED | Yes | Commission edge-case suite still required |
| Finance Setup | Expense Type create/edit/hard delete | Partial | PASS | NOT STARTED | Yes | Unreferenced CRUD automated; referenced-delete message still requires verification |
| Finance Setup | Yield Type CRUD/archive | Partial | PARTIAL | NOT STARTED | Yes | Create and stock separation covered |
| Finance | Market Rate and Buyer Offer | Partial | PASS | NOT STARTED | Yes | Below/above-market offers and offer edit/delete covered locally |
| Finance | Harvest, sale revenue and stock | Yes | PASS | NOT STARTED | Yes | Actual sale rate and separate yield buckets covered |
| Finance | Sale cancellation/reversal | No | NOT STARTED | NOT STARTED | Yes | Critical gap |
| Finance | Wage settlement/idempotency | Yes | PASS | NOT STARTED | Yes | Duplicate finalization rejected; one expense; outstanding reconciled |
| Finance | Fertilizer/vendor source idempotency | No | NOT STARTED | NOT STARTED | No | Critical gap |
| Finance | Full season-summary reconciliation | No | NOT STARTED | NOT STARTED | No | Category-by-category fixture required |
| Finance mobile | Shared dropdown behavior | Yes | PASS | N/A | Yes | Loading/search/selection/persistence/reopen/dismiss covered; pixel/upward opening manual |
| Finance mobile | Form prepopulation, mutation, refresh and messages | No | NOT STARTED | N/A | Yes | Renderer/API mock suites pending |
| Finance | Historical finalized-rate immutability | No | NOT STARTED | NOT STARTED | No | Critical gap |
| Finance | Realistic migration fixture | No | NOT STARTED | NOT STARTED | No | Empty-schema migration is insufficient |
| Dashboard | Language labels and configurable 8 quick actions | No | NOT STARTED | N/A | Yes | Whole-app regression inventory pending |
| Crop/Fertilizer | Localized master/management labels | No | NOT STARTED | N/A | Yes | Whole-app regression inventory pending |
| Labour/forms | Keyboard does not obscure lower fields | No | NOT STARTED | N/A | Yes | Must check all long forms on Android |
| Android | Bundle/export | Build only | NOT RUN THIS PASS | N/A | No | Never counted as functional UI evidence |

## Current verified totals

- Backend: **1 suite, 19 explicit assertions**, locally PASS.
- Mobile: **1 suite, 1 test**, locally PASS; shared-select test contains multiple behavioral expectations.
- D1: **0 endpoints verified** because the isolated test database has not yet been provisioned.
- Manual device: not executed in this automated pass.
