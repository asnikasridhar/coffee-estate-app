import { json, options, body, fail } from '../../_shared/http.js';
import { financeContext } from '../../_shared/finance.js';
import { payrollSetup, payrollDaily, salaryPreview, payrollWrite } from '../../_shared/payroll.js';
export function onRequestOptions() {
  return options();
}
export async function onRequestGet({
  request,
  env,
  params
}) {
  try {
    const {
        propertyId
      } = await financeContext(request, env),
      b = Object.fromEntries(new URL(request.url).searchParams);
    if (params.action === 'setup') return json(await payrollSetup(env, propertyId));
    if (params.action === 'daily') return json(await payrollDaily(env, propertyId, b.date, b.season_id));
    if (params.action === 'preview') return json(await salaryPreview(env, propertyId, b));
    return json({
      error: 'Unknown payroll resource'
    }, 404);
  } catch (e) {
    return fail(e, 'Could not load salary');
  }
}
export async function onRequestPost({
  request,
  env,
  params
}) {
  try {
    const {
        propertyId
      } = await financeContext(request, env),
      b = await body(request);
    return json(await payrollWrite(env, propertyId, params.action, b, String(b.created_by || 'Owner').slice(0, 80)), 201);
  } catch (e) {
    return fail(e, 'Could not save salary');
  }
}
