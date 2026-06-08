import { json, options, userIdFromRequest, all } from '../../_shared/http.js';
export function onRequestOptions() { return options(); }
export async function onRequestGet({ request, env }) {
  try {
    const userId = userIdFromRequest(request);
    const user = await env.DB.prepare(`SELECT user_id, username, email, role FROM users WHERE user_id = ?`).bind(userId).first();
    const properties = await all(env, `SELECT property_id, property_name, total_acre, address_1, address_2, pincode, user_id FROM property WHERE user_id = ? ORDER BY property_name`, userId);
    return json({ user, properties });
  } catch (err) { return json({ error: 'Owner data failed', details: err.message }, 500); }
}
