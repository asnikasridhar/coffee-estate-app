import { Router } from 'express';
import { insert, row, rows, run, update } from '../db.js';
import { resources, applyProperty } from '../config/resources.js';
import { requestContext, requireOwner, assertPropertyAccess } from '../middleware/context.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pick } from '../utils/pick.js';

const router = Router();

function scopedSelect(resource, cfg, userId, propertyId) {
  const base = `SELECT * FROM ${cfg.table}`;
  if (resource === 'properties') return rows(`${base} WHERE user_id = @userId ORDER BY ${cfg.order} LIMIT 500`, { userId });
  if (!propertyId || cfg.propertyMode === 'global') return rows(`${base} ORDER BY ${cfg.order} LIMIT 500`);
  if (cfg.propertyMode === 'direct') return rows(`${base} WHERE property_id = @propertyId ORDER BY ${cfg.order} LIMIT 500`, { propertyId });
  if (cfg.propertyMode === 'viaBlock') return rows(`${base} WHERE block_id IN (SELECT block_id FROM blocks WHERE property_id = @propertyId) ORDER BY ${cfg.order} LIMIT 500`, { propertyId });
  if (cfg.propertyMode === 'viaPlant') return rows(`${base} WHERE plant_id IN (SELECT pd.plant_id FROM plantdetails pd JOIN blocks b ON b.block_id = pd.block_id WHERE b.property_id = @propertyId) ORDER BY ${cfg.order} LIMIT 500`, { propertyId });
  if (cfg.propertyMode === 'viaCrop') return rows(`${base} WHERE crop_id IN (SELECT crop_id FROM cropdetails WHERE property_id = @propertyId) ORDER BY ${cfg.order} LIMIT 500`, { propertyId });
  return rows(`${base} ORDER BY ${cfg.order} LIMIT 500`);
}

router.get('/:resource', asyncHandler((req, res) => {
  const cfg = resources[req.params.resource];
  if (!cfg) return res.status(404).json({ error: 'Unknown resource' });
  const { userId, propertyId } = requestContext(req);
  if (userId) requireOwner(userId);
  if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  res.json(scopedSelect(req.params.resource, cfg, userId, propertyId));
}));

router.post('/:resource', asyncHandler((req, res) => {
  const cfg = resources[req.params.resource];
  if (!cfg) return res.status(404).json({ error: 'Unknown resource' });
  const { userId, propertyId } = requestContext(req);
  if (userId) requireOwner(userId);
  if (userId && propertyId) assertPropertyAccess(userId, propertyId);

  let payload = { ...pick(req.body, cfg.allowed), created_by: req.body.created_by || 'Admin' };
  if (req.params.resource === 'properties') payload.user_id = userId || payload.user_id;
  payload = applyProperty(req.params.resource, payload, propertyId);

  const result = insert(cfg.table, payload);
  res.status(201).json(row(`SELECT * FROM ${cfg.table} WHERE ${cfg.id} = ?`, [result.lastInsertRowid]));
}));

router.patch('/:resource/:id', asyncHandler((req, res) => {
  const cfg = resources[req.params.resource];
  if (!cfg) return res.status(404).json({ error: 'Unknown resource' });
  update(cfg.table, cfg.id, req.params.id, pick(req.body, cfg.allowed));
  res.json(row(`SELECT * FROM ${cfg.table} WHERE ${cfg.id} = ?`, [req.params.id]));
}));

router.delete('/:resource/:id', asyncHandler((req, res) => {
  const cfg = resources[req.params.resource];
  if (!cfg) return res.status(404).json({ error: 'Unknown resource' });
  run(`DELETE FROM ${cfg.table} WHERE ${cfg.id} = ?`, [req.params.id]);
  res.status(204).end();
}));

export default router;
