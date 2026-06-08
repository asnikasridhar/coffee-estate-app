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
  res.json(rows(`SELECT a.attendance_id, date(a.entry_date) entry_date, a.attendance_value, l.name AS labor_name, COALESCE(w.wage_fixed + w.wage_variable, 0) AS wage, p.property_name, u.username AS user_name, ROUND(a.attendance_value * COALESCE(w.wage_fixed + w.wage_variable,0), 2) labor_cost FROM attendance a JOIN labors l ON l.labor_id = a.labor_id LEFT JOIN wage w ON w.labor_id = l.labor_id JOIN property p ON p.property_id = a.property_id JOIN users u ON u.user_id = a.user_id WHERE date(a.entry_date) BETWEEN date(@from) AND date(@to) ${propertyId ? 'AND a.property_id = @propertyId' : ''} ORDER BY a.entry_date DESC, a.attendance_id DESC`, params));
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
  const result = run(`INSERT INTO attendance (labor_id, property_id, user_id, entry_date, created_by, attendance_value) VALUES (@labor_id, @property_id, @user_id, @entry_date, @created_by, @attendance_value)`, payload);
  res.status(201).json(row('SELECT * FROM attendance WHERE attendance_id = ?', [result.lastInsertRowid]));
}));

export default router;
