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
  if (cfg.propertyMode === 'ownerColumn') return rows(`${base} WHERE ${cfg.ownerColumn} = @userId ORDER BY ${cfg.order} LIMIT 500`, { userId });
  if (cfg.propertyMode === 'global') return rows(`${base} ORDER BY ${cfg.order} LIMIT 500`);
  if (!propertyId && cfg.propertyMode === 'direct') throw Object.assign(new Error('Select a property first'), { status: 400 });
  if (cfg.propertyMode === 'direct') return rows(`${base} WHERE property_id = @propertyId ORDER BY ${cfg.order} LIMIT 500`, { propertyId });
  if (cfg.propertyMode === 'viaBlock') return rows(`${base} WHERE block_id IN (SELECT block_id FROM blocks WHERE property_id = @propertyId) ORDER BY ${cfg.order} LIMIT 500`, { propertyId });
  if (cfg.propertyMode === 'viaPlant') return rows(`${base} WHERE plant_id IN (SELECT pd.plant_id FROM plantdetails pd WHERE pd.property_id = @propertyId) ORDER BY ${cfg.order} LIMIT 500`, { propertyId });
  if (cfg.propertyMode === 'viaCropMaster') return rows(`${base} WHERE crop_id IN (SELECT crop_id FROM crop_master WHERE property_id = @propertyId) ORDER BY ${cfg.order} LIMIT 500`, { propertyId });
  if (cfg.propertyMode === 'viaCropType') return rows(`${base} WHERE crop_type_id IN (SELECT ct.crop_type_id FROM crop_type_master ct JOIN crop_master c ON c.crop_id=ct.crop_id WHERE c.property_id = @propertyId) ORDER BY ${cfg.order} LIMIT 500`, { propertyId });
  if (cfg.propertyMode === 'viaCrop') return rows(`${base} WHERE crop_id IN (SELECT crop_id FROM cropdetails WHERE property_id = @propertyId) ORDER BY ${cfg.order} LIMIT 500`, { propertyId });
  return rows(`${base} ORDER BY ${cfg.order} LIMIT 500`);
}

function authorizedRecord(cfg, id, userId, propertyId) {
  if (cfg.propertyMode === 'owner') return row(`SELECT ${cfg.id} FROM ${cfg.table} WHERE ${cfg.id} = @id AND user_id = @userId`, { id, userId });
  if (cfg.propertyMode === 'ownerColumn') return row(`SELECT ${cfg.id} FROM ${cfg.table} WHERE ${cfg.id} = @id AND ${cfg.ownerColumn} = @userId`, { id, userId });
  if (cfg.propertyMode === 'direct') return propertyId ? row(`SELECT * FROM ${cfg.table} WHERE ${cfg.id} = @id AND property_id = @propertyId`, { id, propertyId }) : null;
  if (cfg.propertyMode === 'viaCropMaster') return row(`SELECT t.${cfg.id} FROM ${cfg.table} t JOIN crop_master c ON c.crop_id=t.crop_id JOIN property p ON p.property_id=c.property_id WHERE t.${cfg.id}=@id AND p.user_id=@userId`, { id, userId });
  if (cfg.propertyMode === 'viaCropType') return row(`SELECT t.${cfg.id} FROM ${cfg.table} t JOIN crop_type_master ct ON ct.crop_type_id=t.crop_type_id JOIN crop_master c ON c.crop_id=ct.crop_id JOIN property p ON p.property_id=c.property_id WHERE t.${cfg.id}=@id AND p.user_id=@userId`, { id, userId });
  return null;
}

function normalizePayload(resource, payload) {
  if (resource === 'blocks' && payload.parent_block_id === '') {
    return { ...payload, parent_block_id: null };
  }
  return payload;
}

function normalizeBusinessPayload(resource, payload) {
  if (!['fertilizerPurchases','fertilizerApplications','fertilizerAdjustments'].includes(resource)) return payload;
  const master = row('SELECT purchase_unit_id,base_unit_id,conversion_to_base FROM fertilizer_master WHERE fertilizer_master_id=? AND is_active=1', [Number(payload.fertilizer_master_id)]);
  if (!master) throw Object.assign(new Error('Select an active fertilizer'), { status: 400 });
  const quantity=Number(payload.quantity), unitId=Number(payload.unit_id);
  if (!(quantity>0)) throw Object.assign(new Error('Quantity must be greater than zero'), { status: 400 });
  if (![Number(master.purchase_unit_id),Number(master.base_unit_id)].includes(unitId)) throw Object.assign(new Error('Unit is not valid for the selected fertilizer'), { status: 400 });
  const factor=unitId===Number(master.base_unit_id)?1:Number(master.conversion_to_base||1);
  const result={...payload,quantity,unit_id:unitId,quantity_base:Number((quantity*factor).toFixed(4))};
  if(resource==='fertilizerPurchases')result.total_amount=Number((quantity*Number(payload.rate_per_unit||0)).toFixed(2));
  return result;
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

  let payload = pick(req.body, cfg.allowed);
  if (cfg.allowed.includes('created_by')) payload.created_by = req.body.created_by || 'Admin';
  if (req.params.resource === 'properties') payload.user_id = userId || payload.user_id;
  if (cfg.propertyMode === 'ownerColumn') payload[cfg.ownerColumn] = userId;
  payload = applyProperty(req.params.resource, payload, propertyId);
  payload = normalizePayload(req.params.resource, payload);
  if (payload.property_id) assertPropertyAccess(userId, payload.property_id);
  payload = normalizeBusinessPayload(req.params.resource, payload);

  const result = insert(cfg.table, payload);
  res.status(201).json(row(`SELECT * FROM ${cfg.table} WHERE ${cfg.id} = ?`, [result.lastInsertRowid]));
}));

router.patch('/:resource/:id', asyncHandler((req, res) => {
  const cfg = resources[req.params.resource];
  if (!cfg) return res.status(404).json({ error: 'Unknown resource' });
  const { userId, propertyId } = requestContext(req);
  requireOwner(userId);
  if (propertyId) assertPropertyAccess(userId, propertyId);
  const existing=authorizedRecord(cfg, req.params.id, userId, propertyId);
  if (!existing) return res.status(404).json({ error: 'Record not found' });
  let payload = normalizePayload(req.params.resource, pick(req.body, cfg.allowed));
  if (cfg.propertyMode === 'ownerColumn') payload[cfg.ownerColumn] = userId;
  const normalizedBusiness=normalizeBusinessPayload(req.params.resource,{...existing,...payload});
  if(['fertilizerPurchases','fertilizerApplications','fertilizerAdjustments'].includes(req.params.resource)){
    payload.quantity=normalizedBusiness.quantity;
    payload.unit_id=normalizedBusiness.unit_id;
    payload.quantity_base=normalizedBusiness.quantity_base;
    if(req.params.resource==='fertilizerPurchases')payload.total_amount=normalizedBusiness.total_amount;
  }
  update(cfg.table, cfg.id, req.params.id, payload);
  res.json(row(`SELECT * FROM ${cfg.table} WHERE ${cfg.id} = ?`, [req.params.id]));
}));

router.delete('/:resource/:id', asyncHandler((req, res) => {
  const cfg = resources[req.params.resource];
  if (!cfg) return res.status(404).json({ error: 'Unknown resource' });
  const { userId, propertyId } = requestContext(req);
  requireOwner(userId);
  if (propertyId) assertPropertyAccess(userId, propertyId);
  if (!authorizedRecord(cfg, req.params.id, userId, propertyId)) return res.status(404).json({ error: 'Record not found' });
  run(`DELETE FROM ${cfg.table} WHERE ${cfg.id} = ?`, [req.params.id]);
  res.status(204).end();
}));

export default router;
