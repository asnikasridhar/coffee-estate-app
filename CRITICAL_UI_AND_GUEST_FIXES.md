# Critical UI, API and Guest Fixes

Included in this version:

1. Mobile responsiveness
   - Sidebar collapses for tablet/mobile.
   - Cards, forms, tables and date controls resize cleanly.
   - Tables scroll horizontally on small screens.

2. Nature-themed UI refresh
   - Softer green/earth palette.
   - Hero panel and estate placeholder illustrations.
   - Placeholder images live in `client/public/estate-images/`.

3. JSON/API error handling
   - Frontend now detects when an API route returns HTML instead of JSON.
   - Error message now says which API route is missing or not deployed.
   - Added catch-all Cloudflare function route `functions/api/[resource].js` for modules like laborVendors, yieldRates, cropIncome, etc.

4. Charts and tooltips
   - Dashboard includes lightweight CSS bar charts.
   - Stat cards and chart rows include hover tooltips.
   - No extra chart dependency required.

5. Guest/viewer login
   - Guest login is virtual, no D1 seed needed.
   - Username: `guest`
   - Password: `guest123`
   - Guest sees a minimal safe snapshot only.
   - Owner/vendor/labor/wage/expense details are hidden.

6. Cloudflare validation
   - `vite build` works.
   - `wrangler pages functions build` works.

After copying this project or replacing files, push:

```bash
git add .
git commit -m "Critical UI responsive API and guest fixes"
git push origin main
```
