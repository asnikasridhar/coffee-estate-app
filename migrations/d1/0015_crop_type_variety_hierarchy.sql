CREATE TABLE IF NOT EXISTS crop_master (
  crop_id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop_name TEXT NOT NULL,
  property_id INTEGER NOT NULL,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id),
  UNIQUE(property_id, crop_name)
);

CREATE TABLE IF NOT EXISTS crop_type_master (
  crop_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop_id INTEGER NOT NULL,
  type_name TEXT NOT NULL,
  block_id INTEGER,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(crop_id) REFERENCES crop_master(crop_id),
  FOREIGN KEY(block_id) REFERENCES blocks(block_id),
  UNIQUE(crop_id, type_name)
);

CREATE TABLE IF NOT EXISTS variety_master (
  variety_master_id INTEGER PRIMARY KEY AUTOINCREMENT,
  variety_id INTEGER UNIQUE,
  crop_type_id INTEGER NOT NULL,
  variety_name TEXT NOT NULL,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(crop_type_id) REFERENCES crop_type_master(crop_type_id),
  UNIQUE(crop_type_id, variety_name)
);

CREATE TRIGGER IF NOT EXISTS trg_variety_master_public_id
AFTER INSERT ON variety_master
FOR EACH ROW WHEN NEW.variety_id IS NULL
BEGIN
  UPDATE variety_master SET variety_id = NEW.variety_master_id
  WHERE variety_master_id = NEW.variety_master_id;
END;

ALTER TABLE plant_inventory
ADD COLUMN variety_master_id INTEGER REFERENCES variety_master(variety_master_id);

CREATE INDEX IF NOT EXISTS idx_crop_master_property ON crop_master(property_id);
CREATE INDEX IF NOT EXISTS idx_crop_type_crop ON crop_type_master(crop_id);
CREATE INDEX IF NOT EXISTS idx_variety_crop_type ON variety_master(crop_type_id);
CREATE INDEX IF NOT EXISTS idx_plant_inventory_variety ON plant_inventory(variety_master_id);

INSERT OR IGNORE INTO crop_master (crop_name, property_id, created_by)
SELECT DISTINCT
  CASE
    WHEN lower(pd.plant_type) LIKE '%arabica%' OR lower(pd.plant_type) LIKE '%robusta%' THEN 'Coffee'
    WHEN lower(pd.plant_type) LIKE '%pepper%' THEN 'Pepper'
    ELSE 'Legacy Plants'
  END,
  pd.property_id,
  'Migration 0015'
FROM plantdetails pd
WHERE pd.property_id IS NOT NULL;

INSERT OR IGNORE INTO crop_type_master (crop_id, type_name, block_id, created_by)
SELECT cm.crop_id, pd.plant_type, pd.block_id, 'Migration 0015'
FROM plantdetails pd
JOIN crop_master cm ON cm.property_id = pd.property_id
 AND cm.crop_name = CASE
   WHEN lower(pd.plant_type) LIKE '%arabica%' OR lower(pd.plant_type) LIKE '%robusta%' THEN 'Coffee'
   WHEN lower(pd.plant_type) LIKE '%pepper%' THEN 'Pepper'
   ELSE 'Legacy Plants'
 END
WHERE pd.property_id IS NOT NULL;

INSERT OR IGNORE INTO variety_master (crop_type_id, variety_name, created_by)
SELECT ctm.crop_type_id,
       COALESCE(NULLIF(trim(pd.plantdetailscol),''), pd.plant_type),
       'Migration 0015'
FROM plantdetails pd
JOIN crop_master cm ON cm.property_id = pd.property_id
 AND cm.crop_name = CASE
   WHEN lower(pd.plant_type) LIKE '%arabica%' OR lower(pd.plant_type) LIKE '%robusta%' THEN 'Coffee'
   WHEN lower(pd.plant_type) LIKE '%pepper%' THEN 'Pepper'
   ELSE 'Legacy Plants'
 END
JOIN crop_type_master ctm ON ctm.crop_id = cm.crop_id
 AND ctm.type_name = pd.plant_type
WHERE pd.property_id IS NOT NULL;

UPDATE plant_inventory
SET variety_master_id = (
  SELECT vm.variety_master_id
  FROM plantdetails pd
  JOIN crop_master cm ON cm.property_id = pd.property_id
   AND cm.crop_name = CASE
     WHEN lower(pd.plant_type) LIKE '%arabica%' OR lower(pd.plant_type) LIKE '%robusta%' THEN 'Coffee'
     WHEN lower(pd.plant_type) LIKE '%pepper%' THEN 'Pepper'
     ELSE 'Legacy Plants'
   END
  JOIN crop_type_master ctm ON ctm.crop_id = cm.crop_id
   AND ctm.type_name = pd.plant_type
  JOIN variety_master vm ON vm.crop_type_id = ctm.crop_type_id
   AND vm.variety_name = COALESCE(NULLIF(trim(pd.plantdetailscol),''), pd.plant_type)
  WHERE pd.plant_id = plant_inventory.plant_id
)
WHERE variety_master_id IS NULL AND plant_id IS NOT NULL;
