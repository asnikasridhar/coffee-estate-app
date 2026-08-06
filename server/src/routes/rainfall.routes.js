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
  res.json(rows(`SELECT r.rain_id, r.block_id, date(r.date_time) recorded_date, r.rain_amount AS rain_value, 'mm' AS baseunit_name, p.property_name, b.block_name FROM raindetails r LEFT JOIN blocks b ON b.block_id = r.block_id LEFT JOIN property p ON p.property_id = b.property_id WHERE 1=1 ${propertyId ? 'AND b.property_id = @propertyId' : ''} ORDER BY r.date_time DESC, r.rain_id DESC`, { propertyId }));
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

router.patch('/:id', asyncHandler((req, res) => {
  const { userId, propertyId } = requestContext(req);
  if (userId) requireOwner(userId);
  if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  const payload = rainSchema.parse(req.body);
  if (propertyId && !row('SELECT block_id FROM blocks WHERE block_id = ? AND property_id = ?', [payload.block_id, propertyId])) throw new Error('Block does not belong to selected property');
  const result = run(`UPDATE raindetails SET block_id = @block_id, rain_amount = @rain_value, date_time = @recorded_date, modified_by = @modified_by, modified_on = CURRENT_TIMESTAMP WHERE rain_id = @id ${propertyId ? 'AND block_id IN (SELECT block_id FROM blocks WHERE property_id = @propertyId)' : ''}`, { ...payload, modified_by: req.body.modified_by || 'Admin', id: req.params.id, propertyId });
  if (!result.changes) return res.status(404).json({ error: 'Rainfall entry not found' });
  res.json(row('SELECT * FROM raindetails WHERE rain_id = ?', [req.params.id]));
}));

router.delete('/:id', asyncHandler((req, res) => {
  const { userId, propertyId } = requestContext(req);
  if (userId) requireOwner(userId);
  if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  const result = run(`DELETE FROM raindetails WHERE rain_id = @id ${propertyId ? 'AND block_id IN (SELECT block_id FROM blocks WHERE property_id = @propertyId)' : ''}`, { id: req.params.id, propertyId });
  if (!result.changes) return res.status(404).json({ error: 'Rainfall entry not found' });
  res.status(204).end();
}));

export default router;
