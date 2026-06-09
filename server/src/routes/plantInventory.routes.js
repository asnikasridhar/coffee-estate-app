import { Router } from 'express';
import { row, rows, run } from '../db.js';
import { requestContext, requireOwner, assertPropertyAccess } from '../middleware/context.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

function requireContext(req) {
  const { userId, propertyId } = requestContext(req);
  if (userId) requireOwner(userId);
  if (!propertyId) throw new Error('Select a property before managing plant inventory');
  if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  return { userId, propertyId };
}

router.get('/', asyncHandler((req, res) => {
  const { propertyId } = requireContext(req);
  const blockId = req.query.block_id ? Number(req.query.block_id) : 0;
  const subBlock = req.query.sub_block_name || '';
  const params = { propertyId, blockId, subBlock };
  res.json(rows(`
    SELECT pi.plant_inventory_id, pi.property_id, p.property_name, pi.block_id, b.block_name,
           pi.sub_block_name, pi.plant_id, pd.plant_type, pi.plant_count, pi.planting_date,
           pi.notes, pi.created_on, pi.created_by, pi.modified_on, pi.modified_by
    FROM plant_inventory pi
    JOIN property p ON p.property_id = pi.property_id
    JOIN blocks b ON b.block_id = pi.block_id
    JOIN plantdetails pd ON pd.plant_id = pi.plant_id
    WHERE pi.property_id = @propertyId
      AND (@blockId = 0 OR pi.block_id = @blockId)
      AND (@subBlock = '' OR COALESCE(pi.sub_block_name,'') = @subBlock)
    ORDER BY b.block_name, pi.sub_block_name, pd.plant_type
  `, params));
}));

router.get('/summary', asyncHandler((req, res) => {
  const { propertyId } = requireContext(req);
  const blockDistribution = rows(`
    SELECT b.block_name AS name, COALESCE(SUM(pi.plant_count),0) AS value
    FROM blocks b
    LEFT JOIN plant_inventory pi ON pi.block_id = b.block_id AND pi.property_id = @propertyId
    WHERE b.property_id = @propertyId
    GROUP BY b.block_id, b.block_name
    HAVING value > 0
    ORDER BY value DESC
  `, { propertyId });
  const plantTypeDistribution = rows(`
    SELECT pd.plant_type AS name, COALESCE(SUM(pi.plant_count),0) AS value
    FROM plant_inventory pi
    JOIN plantdetails pd ON pd.plant_id = pi.plant_id
    WHERE pi.property_id = @propertyId
    GROUP BY pd.plant_id, pd.plant_type
    ORDER BY value DESC
  `, { propertyId });
  const bySubBlock = rows(`
    SELECT b.block_name, COALESCE(pi.sub_block_name,'Unspecified') AS sub_block_name, COALESCE(SUM(pi.plant_count),0) AS plant_count
    FROM plant_inventory pi
    JOIN blocks b ON b.block_id = pi.block_id
    WHERE pi.property_id = @propertyId
    GROUP BY b.block_name, COALESCE(pi.sub_block_name,'Unspecified')
    ORDER BY b.block_name, plant_count DESC
  `, { propertyId });
  const totals = row(`SELECT COUNT(*) entries, COALESCE(SUM(plant_count),0) total_plants FROM plant_inventory WHERE property_id = @propertyId`, { propertyId });
  res.json({ totals, blockDistribution, plantTypeDistribution, bySubBlock });
}));

router.post('/', asyncHandler((req, res) => {
  const { propertyId } = requireContext(req);
  const payload = {
    property_id: propertyId,
    block_id: Number(req.body.block_id),
    sub_block_name: req.body.sub_block_name || null,
    plant_id: Number(req.body.plant_id),
    plant_count: Number(req.body.plant_count || 0),
    planting_date: req.body.planting_date || null,
    notes: req.body.notes || null,
    created_by: req.body.created_by || 'Admin'
  };
  const block = row('SELECT block_id FROM blocks WHERE block_id = @block_id AND property_id = @property_id', payload);
  if (!block) throw new Error('Selected block does not belong to the selected property');
  const result = run(`INSERT INTO plant_inventory (property_id, block_id, sub_block_name, plant_id, plant_count, planting_date, notes, created_by)
                      VALUES (@property_id, @block_id, @sub_block_name, @plant_id, @plant_count, @planting_date, @notes, @created_by)`, payload);
  res.status(201).json(row('SELECT * FROM plant_inventory WHERE plant_inventory_id = ?', [result.lastInsertRowid]));
}));

router.patch('/:id', asyncHandler((req, res) => {
  const { propertyId } = requireContext(req);
  const existing = row('SELECT * FROM plant_inventory WHERE plant_inventory_id = ? AND property_id = ?', [req.params.id, propertyId]);
  if (!existing) return res.status(404).json({ error: 'Plant inventory record not found' });
  const payload = {
    id: Number(req.params.id),
    property_id: propertyId,
    block_id: Number(req.body.block_id ?? existing.block_id),
    sub_block_name: req.body.sub_block_name ?? existing.sub_block_name,
    plant_id: Number(req.body.plant_id ?? existing.plant_id),
    plant_count: Number(req.body.plant_count ?? existing.plant_count),
    planting_date: req.body.planting_date ?? existing.planting_date,
    notes: req.body.notes ?? existing.notes,
    modified_by: req.body.modified_by || req.body.created_by || 'Admin'
  };
  const block = row('SELECT block_id FROM blocks WHERE block_id = @block_id AND property_id = @property_id', payload);
  if (!block) throw new Error('Selected block does not belong to the selected property');
  run(`UPDATE plant_inventory
       SET block_id=@block_id, sub_block_name=@sub_block_name, plant_id=@plant_id, plant_count=@plant_count,
           planting_date=@planting_date, notes=@notes, modified_on=CURRENT_TIMESTAMP, modified_by=@modified_by
       WHERE plant_inventory_id=@id AND property_id=@property_id`, payload);
  res.json(row('SELECT * FROM plant_inventory WHERE plant_inventory_id = ?', [req.params.id]));
}));

router.delete('/:id', asyncHandler((req, res) => {
  const { propertyId } = requireContext(req);
  run('DELETE FROM plant_inventory WHERE plant_inventory_id = ? AND property_id = ?', [req.params.id, propertyId]);
  res.status(204).end();
}));

export default router;
