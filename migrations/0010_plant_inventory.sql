-- Plant Inventory CRUD enhancement
-- Safe to run multiple times in SQLite/D1.

CREATE TABLE IF NOT EXISTS plant_inventory (
  plant_inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  block_id INTEGER NOT NULL,
  sub_block_name TEXT,
  plant_id INTEGER NOT NULL,
  plant_count INTEGER NOT NULL DEFAULT 0,
  planting_date TEXT,
  spacing TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id),
  FOREIGN KEY(block_id) REFERENCES blocks(block_id),
  FOREIGN KEY(plant_id) REFERENCES plantdetails(plant_id)
);

CREATE INDEX IF NOT EXISTS idx_plant_inventory_property ON plant_inventory(property_id);
CREATE INDEX IF NOT EXISTS idx_plant_inventory_block ON plant_inventory(block_id);
CREATE INDEX IF NOT EXISTS idx_plant_inventory_plant ON plant_inventory(plant_id);

-- Optional seed: only inserts when plant_inventory is empty.
INSERT INTO plant_inventory (property_id, block_id, sub_block_name, plant_id, plant_count, planting_date, spacing, status, notes, created_by)
SELECT
  b.property_id,
  b.block_id,
  'Main section',
  pd.plant_id,
  CASE WHEN b.block_area IS NOT NULL THEN CAST((b.block_area * 450) AS INTEGER) ELSE 250 END,
  date('now'),
  '6 x 6 ft',
  'active',
  'Initial sample inventory - replace with actual estate count',
  'System'
FROM blocks b
JOIN plantdetails pd ON pd.block_id = b.block_id
WHERE NOT EXISTS (SELECT 1 FROM plant_inventory)
LIMIT 20;
