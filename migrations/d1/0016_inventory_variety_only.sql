INSERT OR IGNORE INTO crop_master (crop_name, property_id, created_by)
SELECT 'Legacy Plants', property_id, 'Migration 0016'
FROM plant_inventory
WHERE variety_master_id IS NULL
GROUP BY property_id;

INSERT OR IGNORE INTO crop_type_master (crop_id, type_name, created_by)
SELECT crop_id, 'Unclassified', 'Migration 0016'
FROM crop_master
WHERE crop_name = 'Legacy Plants';

INSERT OR IGNORE INTO variety_master (crop_type_id, variety_name, created_by)
SELECT crop_type_id, 'Unclassified', 'Migration 0016'
FROM crop_type_master
WHERE type_name = 'Unclassified';

UPDATE plant_inventory
SET variety_master_id = (
  SELECT vm.variety_master_id
  FROM crop_master cm
  JOIN crop_type_master ct ON ct.crop_id = cm.crop_id
  JOIN variety_master vm ON vm.crop_type_id = ct.crop_type_id
  WHERE cm.property_id = plant_inventory.property_id
    AND cm.crop_name = 'Legacy Plants'
    AND ct.type_name = 'Unclassified'
    AND vm.variety_name = 'Unclassified'
)
WHERE variety_master_id IS NULL;

CREATE TABLE plant_inventory_new (
  plant_inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  block_id INTEGER,
  sub_block_name TEXT,
  variety_master_id INTEGER NOT NULL,
  plant_count INTEGER NOT NULL DEFAULT 0,
  planting_date TEXT,
  spacing TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
  notes TEXT,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id),
  FOREIGN KEY(block_id) REFERENCES blocks(block_id),
  FOREIGN KEY(variety_master_id) REFERENCES variety_master(variety_master_id)
);

INSERT INTO plant_inventory_new (
  plant_inventory_id, property_id, block_id, sub_block_name,
  variety_master_id, plant_count, planting_date, spacing, status,
  notes, created_on, created_by, modified_on, modified_by
)
SELECT
  plant_inventory_id, property_id, block_id, sub_block_name,
  variety_master_id, plant_count, planting_date, spacing,
  CASE WHEN lower(COALESCE(status,'active')) = 'active' THEN 'active' ELSE 'inactive' END,
  notes, created_on, created_by, modified_on, modified_by
FROM plant_inventory;

DROP TABLE plant_inventory;
ALTER TABLE plant_inventory_new RENAME TO plant_inventory;

CREATE INDEX idx_plant_inventory_property ON plant_inventory(property_id);
CREATE INDEX idx_plant_inventory_block ON plant_inventory(block_id);
CREATE INDEX idx_plant_inventory_variety ON plant_inventory(variety_master_id);
