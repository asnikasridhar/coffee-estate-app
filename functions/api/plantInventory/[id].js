import { json, options, body, propertyIdFromUrl, userIdFromRequest, assertPropertyAccess, first, fail } from '../../_shared/http.js';
export function onRequestOptions() { return options(); }
async function ctx(request, env) { const userId = userIdFromRequest(request); const propertyId = propertyIdFromUrl(request); if (!propertyId) throw new Error('property_id required'); await assertPropertyAccess(env, userId, propertyId); return { propertyId }; }
export async function onRequestGet({ request, env, params }) {
  try { const { propertyId } = await ctx(request, env); const rec = await first(env, 'SELECT * FROM plant_inventory WHERE plant_inventory_id = ? AND property_id = ?', Number(params.id), propertyId); return rec ? json(rec) : json({ error: 'Not found' }, 404); } catch (err) { return fail(err, 'Plant inventory read failed'); }
}
export async function onRequestPatch({ request, env, params }) {
  try {
    const { propertyId } = await ctx(request, env); const b = await body(request); const id = Number(params.id);
    const existing = await first(env, 'SELECT * FROM plant_inventory WHERE plant_inventory_id = ? AND property_id = ?', id, propertyId);
    if (!existing) return json({ error: 'Not found' }, 404);
    const blockId = Number(b.block_id ?? existing.block_id);
    const block = await first(env, 'SELECT block_id FROM blocks WHERE block_id = ? AND property_id = ?', blockId, propertyId);
    if (!block) return json({ error: 'Selected block does not belong to the selected property' }, 400);
    await env.DB.prepare(`UPDATE plant_inventory SET block_id=?, sub_block_name=?, plant_id=?, plant_count=?, planting_date=?, notes=?, modified_on=CURRENT_TIMESTAMP, modified_by=? WHERE plant_inventory_id=? AND property_id=?`)
      .bind(blockId, b.sub_block_name ?? existing.sub_block_name, Number(b.plant_id ?? existing.plant_id), Number(b.plant_count ?? existing.plant_count), b.planting_date ?? existing.planting_date, b.notes ?? existing.notes, b.modified_by || b.created_by || 'Admin', id, propertyId).run();
    return json(await first(env, 'SELECT * FROM plant_inventory WHERE plant_inventory_id = ?', id));
  } catch (err) { return fail(err, 'Plant inventory update failed'); }
}
export async function onRequestPut(context) { return onRequestPatch(context); }
export async function onRequestDelete({ request, env, params }) {
  try { const { propertyId } = await ctx(request, env); await env.DB.prepare('DELETE FROM plant_inventory WHERE plant_inventory_id = ? AND property_id = ?').bind(Number(params.id), propertyId).run(); return new Response(null, { status: 204 }); } catch (err) { return fail(err, 'Plant inventory delete failed'); }
}
