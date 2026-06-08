import { json, options, body } from '../../_shared/http.js';
export async function onRequestOptions() { return options(); }
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url); const userId = Number(url.searchParams.get('user_id') || 1);
  const r = await env.DB.prepare(`SELECT property_id, property_name, total_acre, address_1, address_2, pincode, user_id FROM property WHERE user_id = ? ORDER BY property_name`).bind(userId).all();
  return json(r.results || []);
}
export async function onRequestPost({ request, env }) {
  try {
    const b = await body(request);
    const rs = await env.DB.prepare(`INSERT INTO property (property_name,total_acre,address_1,address_2,pincode,user_id,created_by) VALUES (?,?,?,?,?,?,?)`)
      .bind(b.property_name, Number(b.total_acre || 0), b.address_1 || '', b.address_2 || '', b.pincode || '', Number(b.user_id || 1), b.created_by || 'Cloudflare').run();
    return json({ property_id: rs.meta.last_row_id, ...b }, 201);
  } catch (err) { return json({ error: 'Create property failed', details: err.message }, 500); }
}
