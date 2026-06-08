import { json, options, body, propertyIdFromUrl } from '../../_shared/http.js';
export async function onRequestOptions() { return options(); }
export async function onRequestGet({ request, env }) {
  try { const propertyId = propertyIdFromUrl(request); const r = await env.DB.prepare(`SELECT block_id, block_name, property_id, block_area FROM blocks WHERE property_id = ? ORDER BY block_name`).bind(propertyId).all(); return json(r.results || []); }
  catch (err) { return json({ error: err.message }, 400); }
}
export async function onRequestPost({ request, env }) {
  try { const b = await body(request); const rs = await env.DB.prepare(`INSERT INTO blocks (block_name, property_id, block_area, created_by) VALUES (?,?,?,?)`).bind(b.block_name, Number(b.property_id), Number(b.block_area || 0), b.created_by || 'Cloudflare').run(); return json({ block_id: rs.meta.last_row_id, ...b }, 201); }
  catch (err) { return json({ error: 'Create block failed', details: err.message }, 500); }
}
