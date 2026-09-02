ALTER TABLE plant_inventory ADD COLUMN area_covered REAL;
ALTER TABLE plant_inventory ADD COLUMN area_unit_id INTEGER REFERENCES baseunit(baseunit_id);
ALTER TABLE plant_inventory ADD COLUMN productive_count INTEGER NOT NULL DEFAULT 0 CHECK(productive_count >= 0);
ALTER TABLE plant_inventory ADD COLUMN non_productive_count INTEGER NOT NULL DEFAULT 0 CHECK(non_productive_count >= 0);
ALTER TABLE plant_inventory ADD COLUMN dead_count INTEGER NOT NULL DEFAULT 0 CHECK(dead_count >= 0);

CREATE INDEX IF NOT EXISTS idx_plant_inventory_property_variety
  ON plant_inventory(property_id, variety_master_id);
