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
  res.json(rows(`SELECT ys.yield_settlement_id AS yieldsettlement_id, date(ys.yield_settlement_date) picking_date, ys.yield_quantity AS quantity, yr.yieldrate_running_rate AS rate, yt.yieldtype_name, bu.baseunit_name, pd.plant_type AS plant_name, p.property_name, ROUND(ys.yield_quantity * COALESCE(yr.yieldrate_running_rate,0), 2) estimated_value FROM yield_settlement ys LEFT JOIN yieldrate yr ON yr.yieldrate_id = ys.yieldrate_id LEFT JOIN yieldtype yt ON yt.yieldtype_id = yr.yieldtype_id LEFT JOIN plantdetails pd ON pd.plant_id = yr.plant_id LEFT JOIN blocks b ON b.block_id = pd.block_id LEFT JOIN property p ON p.property_id = b.property_id LEFT JOIN baseunit bu ON bu.baseunit_id = yr.baseunit_id WHERE 1=1 ${propertyId ? 'AND b.property_id = @propertyId' : ''} ORDER BY ys.yield_settlement_date DESC, ys.yield_settlement_id DESC`, { propertyId }));
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
    const yieldRate = row('SELECT yr.yieldrate_id FROM yieldrate yr JOIN plantdetails pd ON pd.plant_id = yr.plant_id JOIN blocks b ON b.block_id = pd.block_id WHERE yr.yieldrate_id = ? AND b.property_id = ?', [req.body.yieldrate_id, propertyId]);
    if (!yieldRate) throw new Error('Yield rate does not belong to selected property');
  }
  const payload = yieldSchema.parse(req.body);
  const result = run(`INSERT INTO yield_settlement (yieldrate_id, yield_quantity, yield_settlement_date, created_by) VALUES (@yieldrate_id, @quantity, @picking_date, @created_by)`, payload);
  res.status(201).json(row('SELECT * FROM yield_settlement WHERE yield_settlement_id = ?', [result.lastInsertRowid]));
}));

export default router;
