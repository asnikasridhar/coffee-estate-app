import { Router } from 'express';
import { z } from 'zod';
import { insert, row, rows } from '../db.js';
import { requestContext, requireOwner } from '../middleware/context.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/properties', asyncHandler((req, res) => {
  const { userId } = requestContext(req);
  requireOwner(userId);
  res.json(rows('SELECT property_id, property_name, total_acre, address_1, address_2, pincode FROM property WHERE user_id = ? ORDER BY property_name', [userId]));
}));

router.post('/properties', asyncHandler((req, res) => {
  const { userId } = requestContext(req);
  const owner = requireOwner(userId);
  const payload = z.object({
    property_name: z.string().min(2),
    total_acre: z.coerce.number().optional().default(0),
    address_1: z.string().optional().default(''),
    address_2: z.string().optional().default(''),
    pincode: z.string().optional().default('')
  }).parse(req.body);

  const result = insert('property', { ...payload, user_id: userId, created_by: owner.username });
  res.status(201).json(row('SELECT property_id, property_name, total_acre, address_1, address_2, pincode FROM property WHERE property_id = ?', [result.lastInsertRowid]));
}));

export default router;
