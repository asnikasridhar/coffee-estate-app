import { json, options, body, propertyIdFromUrl, userIdFromRequest, assertPropertyAccess, first, fail } from '../../_shared/http.js';

export function onRequestOptions() { return options(); }

async function validRate(env, rateId, propertyId) {
  return first(env, 'SELECT yr.yieldrate_id FROM yieldrate yr JOIN plantdetails pd ON pd.plant_id = yr.plant_id JOIN blocks b ON b.block_id = pd.block_id WHERE yr.yieldrate_id = ? AND b.property_id = ?', Number(rateId), propertyId);
}

const ownedYield = `SELECT ys.yield_settlement_id FROM yield_settlement ys JOIN yieldrate yr ON yr.yieldrate_id = ys.yieldrate_id JOIN plantdetails pd ON pd.plant_id = yr.plant_id JOIN blocks b ON b.block_id = pd.block_id WHERE ys.yield_settlement_id = ? AND b.property_id = ?`;

export async function onRequestPatch({ request, env, params }) {
  try {
    const propertyId = propertyIdFromUrl(request);
    const userId = userIdFromRequest(request);
    await assertPropertyAccess(env, userId, propertyId);
    const b = await body(request);
    if (!await first(env, ownedYield, Number(params.id), propertyId)) return json({ error: 'Yield record not found for selected property' }, 404);
    if (!await validRate(env, b.yieldrate_id, propertyId)) return json({ error: 'Yield rate does not belong to selected property' }, 400);
    await env.DB.prepare('UPDATE yield_settlement SET yieldrate_id = ?, yield_quantity = ?, yield_settlement_date = ?, modified_by = ?, modified_date = CURRENT_TIMESTAMP WHERE yield_settlement_id = ?').bind(Number(b.yieldrate_id), Number(b.quantity ?? b.yield_quantity ?? 0), b.picking_date || b.yield_settlement_date, b.modified_by || b.created_by || 'Mobile', Number(params.id)).run();
    return json(await first(env, 'SELECT * FROM yield_settlement WHERE yield_settlement_id = ?', Number(params.id)));
  } catch (err) { return fail(err, 'Update yield failed'); }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    const propertyId = propertyIdFromUrl(request);
    const userId = userIdFromRequest(request);
    await assertPropertyAccess(env, userId, propertyId);
    if (!await first(env, ownedYield, Number(params.id), propertyId)) return json({ error: 'Yield record not found for selected property' }, 404);
    await env.DB.prepare('DELETE FROM yield_settlement WHERE yield_settlement_id = ?').bind(Number(params.id)).run();
    return json({ ok: true });
  } catch (err) { return fail(err, 'Delete yield failed'); }
}
