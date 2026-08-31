import { json, options, body, propertyIdFromUrl, userIdFromRequest, assertPropertyAccess, first, fail } from '../../_shared/http.js';

export function onRequestOptions() { return options(); }

async function validBlock(env, blockId, propertyId) {
  return first(env, 'SELECT block_id FROM blocks WHERE block_id = ? AND property_id = ?', Number(blockId), propertyId);
}

export async function onRequestPatch({ request, env, params }) {
  try {
    const propertyId = propertyIdFromUrl(request);
    const userId = userIdFromRequest(request);
    await assertPropertyAccess(env, userId, propertyId);
    const b = await body(request);
    const blockId = b.block_id ? Number(b.block_id) : null;
    if (blockId && !await validBlock(env, blockId, propertyId)) return json({ error: 'Block does not belong to selected property' }, 400);
    const result = await env.DB.prepare(`UPDATE raindetails SET block_id = ?, rain_amount = ?, date_time = ?, modified_by = ?, modified_on = CURRENT_TIMESTAMP WHERE rain_id = ? AND COALESCE(property_id,(SELECT property_id FROM blocks WHERE block_id=raindetails.block_id)) = ?`).bind(blockId, Number(b.rain_value ?? b.rain_amount ?? 0), b.recorded_date || b.date_time, b.modified_by || b.created_by || 'Mobile', Number(params.id), propertyId).run();
    if (!result.meta.changes) return json({ error: 'Rainfall record not found for selected property' }, 404);
    return json(await first(env, 'SELECT * FROM raindetails WHERE rain_id = ?', Number(params.id)));
  } catch (err) { return fail(err, 'Update rainfall failed'); }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    const propertyId = propertyIdFromUrl(request);
    const userId = userIdFromRequest(request);
    await assertPropertyAccess(env, userId, propertyId);
    const result = await env.DB.prepare('DELETE FROM raindetails WHERE rain_id = ? AND COALESCE(property_id,(SELECT property_id FROM blocks WHERE block_id=raindetails.block_id)) = ?').bind(Number(params.id), propertyId).run();
    if (!result.meta.changes) return json({ error: 'Rainfall record not found for selected property' }, 404);
    return json({ ok: true });
  } catch (err) { return fail(err, 'Delete rainfall failed'); }
}
