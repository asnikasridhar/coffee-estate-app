import { Router } from 'express';
import { z } from 'zod';
import { row, rows, run } from '../db.js';
import { requestContext, requireOwner, assertPropertyAccess } from '../middleware/context.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dateRange } from '../utils/dateRange.js';

const router = Router();

router.get('/', asyncHandler((req, res) => {
  const { userId, propertyId } = requestContext(req);
  if (userId) requireOwner(userId);
  if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  const params = { ...dateRange(req), propertyId };
  res.json(rows(`SELECT a.attendance_id, a.labor_id, date(a.entry_date) entry_date, a.attendance_value, l.name AS labor_name, COALESCE(w.wage_fixed + w.wage_variable, 0) AS wage, p.property_name, u.username AS user_name, ROUND(a.attendance_value * COALESCE(w.wage_fixed + w.wage_variable,0), 2) labor_cost FROM attendance a JOIN labors l ON l.labor_id = a.labor_id LEFT JOIN wage w ON w.wage_id=(SELECT w2.wage_id FROM wage w2 WHERE w2.labor_id=l.labor_id ORDER BY datetime(COALESCE(w2.modified_on,w2.created_on)) DESC,w2.wage_id DESC LIMIT 1) JOIN property p ON p.property_id = a.property_id JOIN users u ON u.user_id = a.user_id WHERE date(a.entry_date) BETWEEN date(@from) AND date(@to) ${propertyId ? 'AND a.property_id = @propertyId' : ''} ORDER BY a.entry_date DESC, a.attendance_id DESC`, params));
}));

const attendanceSchema = z.object({
  labor_id: z.coerce.number().int().positive(),
  property_id: z.coerce.number().int().positive(),
  user_id: z.coerce.number().int().positive(),
  entry_date: z.string().min(10),
  attendance_value: z.coerce.number().min(0).max(1.5),
  created_by: z.string().max(100).default('Admin')
});

router.post('/', asyncHandler((req, res) => {
  const { userId, propertyId } = requestContext(req);
  if (userId) assertPropertyAccess(userId, Number(req.body.property_id || propertyId));
  const payload = attendanceSchema.parse({ ...req.body, property_id: req.body.property_id || propertyId, user_id: req.body.user_id || userId || 1 });
  const existing = row(`SELECT attendance_id FROM attendance WHERE labor_id = @labor_id AND property_id = @property_id AND date(entry_date) = date(@entry_date) LIMIT 1`, payload);
  if (existing) return res.status(409).json({ error: 'Attendance already present', details: 'Attendance is already recorded for this labourer, property, and date. Edit or clear the existing attendance instead.' });
  const result = run(`INSERT INTO attendance (labor_id, property_id, user_id, entry_date, created_by, attendance_value) VALUES (@labor_id, @property_id, @user_id, @entry_date, @created_by, @attendance_value)`, payload);
  res.status(201).json(row('SELECT * FROM attendance WHERE attendance_id = ?', [result.lastInsertRowid]));
}));

const attendanceEditSchema = attendanceSchema.pick({ labor_id: true, entry_date: true, attendance_value: true });

router.patch('/:id', asyncHandler((req, res) => {
  const { userId, propertyId } = requestContext(req);
  if (userId) requireOwner(userId);
  if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  const payload = attendanceEditSchema.parse(req.body);
  const result = run(`UPDATE attendance SET labor_id = @labor_id, entry_date = @entry_date, attendance_value = @attendance_value, modified_by = @modified_by, modified_on = CURRENT_TIMESTAMP WHERE attendance_id = @id ${propertyId ? 'AND property_id = @propertyId' : ''}`, { ...payload, modified_by: req.body.modified_by || 'Admin', id: req.params.id, propertyId });
  if (!result.changes) return res.status(404).json({ error: 'Attendance entry not found' });
  res.json(row('SELECT * FROM attendance WHERE attendance_id = ?', [req.params.id]));
}));

router.delete('/:id', asyncHandler((req, res) => {
  const { userId, propertyId } = requestContext(req);
  if (userId) requireOwner(userId);
  if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  const result = run(`DELETE FROM attendance WHERE attendance_id = @id ${propertyId ? 'AND property_id = @propertyId' : ''}`, { id: req.params.id, propertyId });
  if (!result.changes) return res.status(404).json({ error: 'Attendance entry not found' });
  res.status(204).end();
}));

export default router;
