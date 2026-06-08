import { json, options, body, userIdFromRequest, all } from '../../_shared/http.js';
export function onRequestOptions() { return options(); }
export async function onRequestGet({ request, env }) {
  const userId = userIdFromRequest(request);
  return json(await all(env, `SELECT property_id, property_name, total_acre, address_1, address_2, pincode, user_id FROM property WHERE user_id = ? ORDER BY property_name`, userId));
}
export async function onRequestPost({ request, env }) {
  try {
    const userId = userIdFromRequest(request);
    const b = await body(request);
    const name = b.property_name || b.propertyName;
    if (!name) return json({ error: 'property_name required' }, 400);
    const r = await env.DB.prepare(`INSERT INTO property (property_name,total_acre,address_1,address_2,pincode,user_id,created_by) VALUES (?,?,?,?,?,?,?)`)
      .bind(name, Number(b.total_acre || 0), b.address_1 || '', b.address_2 || '', b.pincode || '', userId, b.created_by || 'Owner').run();
    const created = await env.DB.prepare(`SELECT property_id, property_name, total_acre, address_1, address_2, pincode, user_id FROM property WHERE property_id = ?`).bind(r.meta.last_row_id).first();
    return json(created, 201);
  } catch (err) { return json({ error: 'Create property failed', details: err.message }, 500); }
}
