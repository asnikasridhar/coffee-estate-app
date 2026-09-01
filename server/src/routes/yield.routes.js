import { Router } from 'express';
import { z } from 'zod';
import { row, rows, run } from '../db.js';
import { requestContext, requireOwner, assertPropertyAccess } from '../middleware/context.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler((req, res) => {
  const { userId, propertyId } = requestContext(req);
  if (userId) requireOwner(userId);
  if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  res.json(rows(`SELECT ys.yield_settlement_id AS yieldsettlement_id, ys.yieldrate_id, yr.yieldrate_code AS yieldrate_name, date(ys.yield_settlement_date) picking_date, ys.yield_quantity AS quantity, yr.yieldrate_running_rate AS rate, yt.yieldtype_name, bu.baseunit_name, pd.plant_type AS plant_name, p.property_name, ROUND(ys.yield_quantity * COALESCE(yr.yieldrate_running_rate,0), 2) estimated_value FROM yield_settlement ys LEFT JOIN yieldrate yr ON yr.yieldrate_id = ys.yieldrate_id LEFT JOIN yieldtype yt ON yt.yieldtype_id = yr.yieldtype_id LEFT JOIN plantdetails pd ON pd.plant_id = yr.plant_id LEFT JOIN property p ON p.property_id = pd.property_id LEFT JOIN baseunit bu ON bu.baseunit_id = yr.baseunit_id WHERE 1=1 ${propertyId ? 'AND pd.property_id = @propertyId' : ''} ORDER BY ys.yield_settlement_date DESC, ys.yield_settlement_id DESC`, { propertyId }));
}));

const yieldSchema = z.object({
  yieldrate_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().min(0),
  picking_date: z.string().min(10),
  created_by: z.string().default('Admin')
});

router.post('/', asyncHandler((req, res) => {
  const { propertyId } = requestContext(req);
  if (propertyId) {
    const yieldRate = row('SELECT yr.yieldrate_id FROM yieldrate yr JOIN plantdetails pd ON pd.plant_id = yr.plant_id WHERE yr.yieldrate_id = ? AND pd.property_id = ?', [req.body.yieldrate_id, propertyId]);
    if (!yieldRate) throw new Error('Yield rate does not belong to selected property');
  }
  const payload = yieldSchema.parse(req.body);
  const result = run(`INSERT INTO yield_settlement (yieldrate_id, yield_quantity, yield_settlement_date, created_by) VALUES (@yieldrate_id, @quantity, @picking_date, @created_by)`, payload);
  res.status(201).json(row('SELECT * FROM yield_settlement WHERE yield_settlement_id = ?', [result.lastInsertRowid]));
}));

router.patch('/:id', asyncHandler((req, res) => {
  const { userId, propertyId } = requestContext(req);
  if (userId) requireOwner(userId);
  if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  const payload = yieldSchema.parse(req.body);
  if (propertyId && !row('SELECT yr.yieldrate_id FROM yieldrate yr JOIN plantdetails pd ON pd.plant_id = yr.plant_id WHERE yr.yieldrate_id = ? AND pd.property_id = ?', [payload.yieldrate_id, propertyId])) throw new Error('Yield rate does not belong to selected property');
  const result = run(`UPDATE yield_settlement SET yieldrate_id = @yieldrate_id, yield_quantity = @quantity, yield_settlement_date = @picking_date, modified_by = @modified_by, modified_date = CURRENT_TIMESTAMP WHERE yield_settlement_id = @id ${propertyId ? 'AND yieldrate_id IN (SELECT yr.yieldrate_id FROM yieldrate yr JOIN plantdetails pd ON pd.plant_id = yr.plant_id WHERE pd.property_id = @propertyId)' : ''}`, { ...payload, modified_by: req.body.modified_by || 'Admin', id: req.params.id, propertyId });
  if (!result.changes) return res.status(404).json({ error: 'Yield entry not found' });
  res.json(row('SELECT * FROM yield_settlement WHERE yield_settlement_id = ?', [req.params.id]));
}));

router.delete('/:id', asyncHandler((req, res) => {
  const { userId, propertyId } = requestContext(req);
  if (userId) requireOwner(userId);
  if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  const result = run(`DELETE FROM yield_settlement WHERE yield_settlement_id = @id ${propertyId ? 'AND yieldrate_id IN (SELECT yr.yieldrate_id FROM yieldrate yr JOIN plantdetails pd ON pd.plant_id = yr.plant_id WHERE pd.property_id = @propertyId)' : ''}`, { id: req.params.id, propertyId });
  if (!result.changes) return res.status(404).json({ error: 'Yield entry not found' });
  res.status(204).end();
}));

export default router;
