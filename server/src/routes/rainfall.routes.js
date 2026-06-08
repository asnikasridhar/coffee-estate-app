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
  res.json(rows(`SELECT r.rain_id, date(r.date_time) recorded_date, r.rain_amount AS rain_value, 'mm' AS baseunit_name, p.property_name, b.block_name FROM raindetails r LEFT JOIN blocks b ON b.block_id = r.block_id LEFT JOIN property p ON p.property_id = b.property_id WHERE 1=1 ${propertyId ? 'AND b.property_id = @propertyId' : ''} ORDER BY r.date_time DESC, r.rain_id DESC`, { propertyId }));
}));

const rainSchema = z.object({
  block_id: z.coerce.number().int().positive(),
  rain_value: z.coerce.number().min(0),
  recorded_date: z.string().min(10),
  created_by: z.string().default('Admin')
});

router.post('/', asyncHandler((req, res) => {
  const { userId, propertyId } = requestContext(req);
  if (userId && propertyId) {
    const block = row('SELECT block_id FROM blocks WHERE block_id = ? AND property_id = ?', [req.body.block_id, propertyId]);
    if (!block) throw new Error('Block does not belong to selected property');
  }
  const payload = rainSchema.parse(req.body);
  const result = run(`INSERT INTO raindetails (block_id, rain_amount, date_time, created_by, created_on) VALUES (@block_id, @rain_value, @recorded_date, @created_by, CURRENT_TIMESTAMP)`, payload);
  res.status(201).json(row('SELECT * FROM raindetails WHERE rain_id = ?', [result.lastInsertRowid]));
}));

export default router;
