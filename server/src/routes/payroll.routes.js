import { workCompletionDay, saveWorkCompletion, addCompletionWork, estateRates, estateDay, estateWrite, assignmentEstimate, salaryReport, rateContext } from '../../../functions/_shared/estateSalary.js';
import { Router } from 'express';
import { db } from '../db.js';
import { requireScopedProperty } from '../middleware/context.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { d1Adapter } from '../utils/d1Adapter.js';
import { payrollSetup, payrollDaily, salaryPreview, payrollWrite } from '../../../functions/_shared/payroll.js';
const router = Router(),
  env = d1Adapter(db);
router.get('/:action', asyncHandler(async (req, res) => {
  const {
    propertyId, userId
  } = requireScopedProperty(req);
  if (!propertyId) return res.status(400).json({
    error: 'Select a property first'
  });
  if (req.params.action === 'work-completion') return res.json(await workCompletionDay(env,propertyId,req.query.date));
  if (req.params.action === 'rate-context') return res.json(await rateContext(env,propertyId,req.query));
  if (req.params.action === 'rates') return res.json(await estateRates(env, propertyId));
  if (req.params.action === 'settlement-day') return res.json(await estateDay(env, propertyId, req.query.date));
  if (req.params.action === 'assignment-rate') return res.json(await assignmentEstimate(env, propertyId, req.query));
  if (req.params.action === 'salary-report') return res.json(await salaryReport(env, propertyId, req.query));
  if (req.params.action === 'setup') return res.json(await payrollSetup(env, propertyId));
  if (req.params.action === 'daily') return res.json(await payrollDaily(env, propertyId, req.query.date, req.query.season_id));
  if (req.params.action === 'preview') return res.json(await salaryPreview(env, propertyId, req.query));
  res.status(404).json({
    error: 'Unknown payroll resource'
  });
}));
router.post('/:action', asyncHandler(async (req, res) => {
  const {
    propertyId, userId
  } = requireScopedProperty(req);
  if (!propertyId) return res.status(400).json({
    error: 'Select a property first'
  });
  if (req.params.action === 'work-completion') return res.status(201).json(await saveWorkCompletion(env,propertyId,req.body,String(userId)));
  if (req.params.action === 'completion-extra-work') return res.status(201).json(await addCompletionWork(env,propertyId,req.body,String(userId)));
  if (['labour-exception','rate-version','overtime-type','pay-selected','settlement-input','settlement-override','settlement-advance'].includes(req.params.action)) return res.status(201).json(await estateWrite(env, propertyId, req.params.action, req.body, String(userId)));
  res.status(201).json(await payrollWrite(env, propertyId, req.params.action, req.body, String(userId)));
}));
export default router;
