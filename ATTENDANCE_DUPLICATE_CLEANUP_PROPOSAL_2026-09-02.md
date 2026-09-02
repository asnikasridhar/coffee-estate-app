# Attendance Duplicate Cleanup Proposal — 2 September 2026

Status: **review only**. No attendance, wage, work-assignment, property, labour, crop, or inventory rows were changed.

## Rule proposed for later approval

For an exact duplicate `(property_id, labor_id, date(entry_date))`, retain the newest row, except where dependency review identifies an older row as the only referenced record. Archive before deletion, validate work assignments, and recalculate labour-cost reports using one authoritative wage row per labour.

## Duplicate groups found in the approved backup

| Labour | Work date | Rows found | Proposed retained row | Review note |
|---|---:|---:|---:|---|
| Sundara | 2025-09-01 | 1, 3, 9 | 9 | Newest row; confirm value with attendance register. Multiple wage rows also inflate cost. |
| Sundara | 2025-09-02 | 4, 10 | 10 | Newest row; confirm value. |
| Best Labour | 2026-06-09 | duplicate pair incl. 19 | 19 | Newest row; confirm value and wage. |
| Test Lab2 | 2026-08-22 | duplicate pair incl. 34 | 34 | Row 34 is linked to work data; preserve dependencies. |
| Test Lab55322 | 2026-09-01 | 2, 5, 12 | 12 | Newest row; no wage amount observed. |
| Test Lab55322 | 2026-09-02 | 6, 13 | 13 | Newest row. |
| TestNewLab1 | 2026-09-01 | 7, 15 | 15 | Newest row. |
| TestNewLab1 | 2026-09-02 | 8, 16 | 16 | Newest row. |
| Vinutha | 2026-06-11 | 20, 21, 22, 23 | 23 | Newest row; verify all downstream references first. |

## Related integrity finding

Labour `1` has more than one wage configuration (`wage_id` 1 at ₹200/day and `wage_id` 3 at ₹320/day). Existing joins could multiply attendance rows by wage rows. Dashboard and attendance queries have been changed to use the most recently modified wage, but choosing the authoritative wage record remains a business decision.

## Required verification before any cleanup

1. Export the target Cloudflare D1 database immediately before cleanup.
2. Produce a dependency count for every candidate attendance ID.
3. Obtain business confirmation of each retained attendance value and the authoritative wage.
4. Archive removed rows with original IDs, timestamps, values, and cleanup batch ID.
5. Run count, cost, wage, and work-assignment reconciliation before and after.
6. Execute cleanup in a transaction and retain a tested rollback script.
