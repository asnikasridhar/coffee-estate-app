import { json, options, first, all, fail } from '../../_shared/http.js';
export function onRequestOptions() { return options(); }
export async function onRequestGet({ env }) {
  try {
    const propertyCount = await first(env, `SELECT COUNT(*) total_properties, COALESCE(SUM(total_acre),0) total_acres FROM property`);
    const rainfall = await first(env, `SELECT ROUND(COALESCE(SUM(rain_amount),0),2) total_rain, COUNT(*) entries FROM raindetails`);
    const yieldTotal = await first(env, `SELECT ROUND(COALESCE(SUM(yield_quantity),0),2) quantity, COUNT(*) entries FROM yield_settlement`);
    const properties = await all(env, `SELECT property_name, total_acre FROM property ORDER BY property_name LIMIT 6`);
    return json({ propertyCount, rainfall, yieldTotal, properties });
  } catch (err) { return fail(err, 'Guest summary failed'); }
}
