import { json, options, body, propertyIdFromUrl, userIdFromRequest, assertPropertyAccess, all, first, fail } from '../../_shared/http.js';
export function onRequestOptions() { return options(); }

async function getContext(request, env) {
  const userId = userIdFromRequest(request);
  const propertyId = propertyIdFromUrl(request);
  if (!propertyId) throw new Error('property_id required');
  await assertPropertyAccess(env, userId, propertyId);
  return { userId, propertyId };
}

export async function onRequestGet({ request, env }) {
  try {
    const { propertyId } = await getContext(request, env);
    const url = new URL(request.url);
    const blockId = Number(url.searchParams.get('block_id') || 0);
    const subBlock = url.searchParams.get('sub_block_name') || '';
    const data = await all(env, `
      SELECT pi.plant_inventory_id, pi.property_id, p.property_name, pi.block_id, b.block_name,
             pi.sub_block_name, pi.plant_id, pd.plant_type, pi.plant_count, pi.planting_date,
             pi.notes, pi.created_on, pi.created_by, pi.modified_on, pi.modified_by
      FROM plant_inventory pi
      JOIN property p ON p.property_id = pi.property_id
      JOIN blocks b ON b.block_id = pi.block_id
      JOIN plantdetails pd ON pd.plant_id = pi.plant_id
      WHERE pi.property_id = ?
        AND (? = 0 OR pi.block_id = ?)
        AND (? = '' OR COALESCE(pi.sub_block_name,'') = ?)
      ORDER BY b.block_name, pi.sub_block_name, pd.plant_type
    `, propertyId, blockId, blockId, subBlock, subBlock);
    return json(data);
  } catch (err) { return fail(err, 'Plant inventory list failed'); }
}

export async function onRequestPost({ request, env }) {
  try {
    const { propertyId } = await getContext(request, env);
    const b = await body(request);
    const blockId = Number(b.block_id);
    const plantId = Number(b.plant_id);
    const plantCount = Number(b.plant_count || 0);
    if (!blockId || !plantId) return json({ error: 'block_id and plant_id are required' }, 400);
    const block = await first(env, 'SELECT block_id FROM blocks WHERE block_id = ? AND property_id = ?', blockId, propertyId);
    if (!block) return json({ error: 'Selected block does not belong to the selected property' }, 400);
    const r = await env.DB.prepare(`INSERT INTO plant_inventory (property_id, block_id, sub_block_name, plant_id, plant_count, planting_date, notes, created_by)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(propertyId, blockId, b.sub_block_name || null, plantId, plantCount, b.planting_date || null, b.notes || null, b.created_by || 'Admin').run();
    const created = await first(env, 'SELECT * FROM plant_inventory WHERE plant_inventory_id = ?', r.meta.last_row_id);
    return json(created, 201);
  } catch (err) { return fail(err, 'Plant inventory create failed'); }
}
