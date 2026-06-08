import { json, options, propertyIdFromUrl } from '../_shared/http.js';
export async function onRequestOptions() { return options(); }
export async function onRequestGet({ request, env }) {
  try {
    const propertyId = propertyIdFromUrl(request);
    const blocks = await env.DB.prepare(`SELECT block_id, block_name, property_id, block_area FROM blocks WHERE property_id = ? ORDER BY block_name`).bind(propertyId).all();
    const labors = await env.DB.prepare(`SELECT l.labor_id, l.name AS labor_name, COALESCE(w.wage_fixed + w.wage_variable,0) AS wage FROM labors l LEFT JOIN wage w ON w.labor_id=l.labor_id ORDER BY l.name`).all();
    const users = await env.DB.prepare(`SELECT user_id, username AS user_name FROM users ORDER BY username`).all();
    const baseUnits = await env.DB.prepare(`SELECT baseunit_id, baseunit_name FROM baseunit ORDER BY baseunit_name`).all();
    const yieldTypes = await env.DB.prepare(`SELECT yt.yieldtype_id, yt.yieldtype_name, yt.plant_id, pd.plant_type AS plant_name FROM yieldtype yt LEFT JOIN plantdetails pd ON pd.plant_id=yt.plant_id ORDER BY yt.yieldtype_name`).all();
    const yieldRates = await env.DB.prepare(`SELECT yr.yieldrate_id, yr.yieldtype_id, yr.yieldrate_running_rate AS rate, yr.yieldrate_code AS season, yr.baseunit_id, bu.baseunit_name FROM yieldrate yr LEFT JOIN baseunit bu ON bu.baseunit_id=yr.baseunit_id ORDER BY yr.yieldrate_code DESC, yr.yieldrate_id DESC`).all();
    return json({ blocks: blocks.results||[], labors: labors.results||[], users: users.results||[], baseUnits: baseUnits.results||[], yieldTypes: yieldTypes.results||[], yieldRates: yieldRates.results||[] });
  } catch (err) { return json({ error: err.message }, 400); }
}
