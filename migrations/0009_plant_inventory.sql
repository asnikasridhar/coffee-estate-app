CREATE TABLE IF NOT EXISTS plant_inventory (
  plant_inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  block_id INTEGER NOT NULL,
  sub_block_name TEXT,
  plant_id INTEGER NOT NULL,
  plant_count INTEGER NOT NULL DEFAULT 0 CHECK (plant_count >= 0),
  planting_date TEXT,
  notes TEXT,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY (property_id) REFERENCES property(property_id),
  FOREIGN KEY (block_id) REFERENCES blocks(block_id),
  FOREIGN KEY (plant_id) REFERENCES plantdetails(plant_id)
);

CREATE INDEX IF NOT EXISTS idx_plant_inventory_property ON plant_inventory(property_id);
CREATE INDEX IF NOT EXISTS idx_plant_inventory_block ON plant_inventory(block_id);
CREATE INDEX IF NOT EXISTS idx_plant_inventory_plant ON plant_inventory(plant_id);
