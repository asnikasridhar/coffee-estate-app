import { estateRates, estateDay, estateWrite, assignmentEstimate, salaryReport, rateContext } from '../../_shared/estateSalary.js';
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
        propertyId, userId
      } = await financeContext(request, env),
      b = Object.fromEntries(new URL(request.url).searchParams);
    if (params.action === 'rate-context') return json(await rateContext(env,propertyId,b));
    if (params.action === 'rates') return json(await estateRates(env, propertyId));
    if (params.action === 'settlement-day') return json(await estateDay(env, propertyId, b.date));
    if (params.action === 'assignment-rate') return json(await assignmentEstimate(env, propertyId, b));
    if (params.action === 'salary-report') return json(await salaryReport(env, propertyId, b));
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
        propertyId, userId
      } = await financeContext(request, env),
      b = await body(request);
    if (['labour-exception','rate-version','overtime-type','pay-selected','settlement-input','settlement-override','settlement-advance'].includes(params.action)) return json(await estateWrite(env, propertyId, params.action, b, String(userId)), 201);
    return json(await payrollWrite(env, propertyId, params.action, b, String(userId)), 201);
  } catch (e) {
    return fail(e, 'Could not save salary');
  }
}
