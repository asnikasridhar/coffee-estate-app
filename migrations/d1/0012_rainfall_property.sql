ALTER TABLE raindetails ADD COLUMN property_id INTEGER REFERENCES property(property_id);

UPDATE raindetails
SET property_id = (
  SELECT blocks.property_id
  FROM blocks
  WHERE blocks.block_id = raindetails.block_id
)
WHERE property_id IS NULL AND block_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_raindetails_property_date
ON raindetails(property_id, date_time);
