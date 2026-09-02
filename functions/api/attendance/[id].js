import { json, options, body, propertyIdFromUrl, userIdFromRequest, assertPropertyAccess, first, fail } from '../../_shared/http.js';

export function onRequestOptions() { return options(); }

export async function onRequestPatch({ request, env, params }) {
  try {
    const propertyId = propertyIdFromUrl(request);
    const userId = await userIdFromRequest(request,env);
    await assertPropertyAccess(env, userId, propertyId);
    const b = await body(request);
    const existing = await first(env, 'SELECT attendance_id FROM attendance WHERE attendance_id = ? AND property_id = ?', Number(params.id), propertyId);
    if (!existing) return json({ error: 'Attendance record not found for selected property' }, 404);
    await env.DB.prepare('UPDATE attendance SET labor_id = ?, entry_date = ?, attendance_value = ?, modified_by = ?, modified_on = CURRENT_TIMESTAMP WHERE attendance_id = ? AND property_id = ?').bind(Number(b.labor_id), b.entry_date, Number(b.attendance_value || 0), b.modified_by || b.created_by || 'Mobile', Number(params.id), propertyId).run();
    return json(await first(env, 'SELECT * FROM attendance WHERE attendance_id = ?', Number(params.id)));
  } catch (err) { return fail(err, 'Update attendance failed'); }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    const propertyId = propertyIdFromUrl(request);
    const userId = await userIdFromRequest(request,env);
    await assertPropertyAccess(env, userId, propertyId);
    const result = await env.DB.prepare('DELETE FROM attendance WHERE attendance_id = ? AND property_id = ?').bind(Number(params.id), propertyId).run();
    if (!result.meta.changes) return json({ error: 'Attendance record not found for selected property' }, 404);
    return json({ ok: true });
  } catch (err) { return fail(err, 'Delete attendance failed'); }
}
