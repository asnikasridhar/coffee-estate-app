ALTER TABLE plantdetails ADD COLUMN property_id INTEGER REFERENCES property(property_id);

UPDATE plantdetails
SET property_id = (
  SELECT b.property_id FROM blocks b WHERE b.block_id = plantdetails.block_id
)
WHERE property_id IS NULL AND block_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_plantdetails_property ON plantdetails(property_id);
