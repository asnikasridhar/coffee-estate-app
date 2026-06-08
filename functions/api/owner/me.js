import { json, options } from '../../_shared/http.js';
export async function onRequestOptions() { return options(); }
export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const userId = Number(url.searchParams.get('user_id') || 1);
    const user = await env.DB.prepare(`SELECT user_id, username, role FROM users WHERE user_id = ?`).bind(userId).first();
    const properties = await env.DB.prepare(`SELECT property_id, property_name, total_acre, address_1, address_2, pincode, user_id FROM property WHERE user_id = ? ORDER BY property_name`).bind(userId).all();
    return json({ user, properties: properties.results || [] });
  } catch (err) { return json({ error: 'Owner data failed', details: err.message }, 500); }
}
