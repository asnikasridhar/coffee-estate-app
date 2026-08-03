-- Work activity and work assignment migration
-- Adds activity master and daily labour/block assignment, safe to run multiple times.

CREATE TABLE IF NOT EXISTS work_activity (
  work_activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  work_activity_name TEXT NOT NULL,
  work_activity_type TEXT,
  notes TEXT,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id)
);

CREATE INDEX IF NOT EXISTS idx_work_activity_property ON work_activity(property_id);

CREATE TABLE IF NOT EXISTS work_assignment (
  work_assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  work_activity_id INTEGER NOT NULL,
  labor_id INTEGER NOT NULL,
  work_date TEXT NOT NULL,
  block_id INTEGER NOT NULL,
  notes TEXT,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id),
  FOREIGN KEY(work_activity_id) REFERENCES work_activity(work_activity_id),
  FOREIGN KEY(labor_id) REFERENCES labors(labor_id),
  FOREIGN KEY(block_id) REFERENCES blocks(block_id)
);

CREATE INDEX IF NOT EXISTS idx_work_assignment_property_date ON work_assignment(property_id, work_date);
CREATE INDEX IF NOT EXISTS idx_work_assignment_activity ON work_assignment(work_activity_id);
CREATE INDEX IF NOT EXISTS idx_work_assignment_block ON work_assignment(block_id);
CREATE INDEX IF NOT EXISTS idx_work_assignment_labor ON work_assignment(labor_id);

-- Prevent duplicate same labour/activity/block/date rows.
CREATE UNIQUE INDEX IF NOT EXISTS ux_work_assignment_day_labor_activity_block
ON work_assignment(property_id, work_date, labor_id, work_activity_id, block_id);

-- Labour can be assigned only if attendance exists for same property and date.
CREATE TRIGGER IF NOT EXISTS trg_work_assignment_requires_attendance
BEFORE INSERT ON work_assignment
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1 FROM attendance a
  WHERE a.property_id = NEW.property_id
    AND a.labor_id = NEW.labor_id
    AND date(a.entry_date) = date(NEW.work_date)
)
BEGIN
  SELECT RAISE(ABORT, 'Labor must have attendance for this property and work date before assigning work activity');
END;

-- Ensure assigned block belongs to same property.
CREATE TRIGGER IF NOT EXISTS trg_work_assignment_block_property
BEFORE INSERT ON work_assignment
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1 FROM blocks b
  WHERE b.block_id = NEW.block_id
    AND b.property_id = NEW.property_id
)
BEGIN
  SELECT RAISE(ABORT, 'Selected block does not belong to this property');
END;

-- Ensure activity belongs to same property.
CREATE TRIGGER IF NOT EXISTS trg_work_assignment_activity_property
BEFORE INSERT ON work_assignment
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1 FROM work_activity wa
  WHERE wa.work_activity_id = NEW.work_activity_id
    AND wa.property_id = NEW.property_id
)
BEGIN
  SELECT RAISE(ABORT, 'Selected work activity does not belong to this property');
END;

-- Seed a few common activities per property when empty.
INSERT INTO work_activity (property_id, work_activity_name, work_activity_type, notes, created_by)
SELECT p.property_id, 'Weeding', 'Field Work', 'Default work activity', 'System'
FROM property p
WHERE NOT EXISTS (SELECT 1 FROM work_activity WHERE property_id = p.property_id AND work_activity_name = 'Weeding');

INSERT INTO work_activity (property_id, work_activity_name, work_activity_type, notes, created_by)
SELECT p.property_id, 'Fertilizer Application', 'Maintenance', 'Default work activity', 'System'
FROM property p
WHERE NOT EXISTS (SELECT 1 FROM work_activity WHERE property_id = p.property_id AND work_activity_name = 'Fertilizer Application');

INSERT INTO work_activity (property_id, work_activity_name, work_activity_type, notes, created_by)
SELECT p.property_id, 'Harvesting / Picking', 'Harvest', 'Default work activity', 'System'
FROM property p
WHERE NOT EXISTS (SELECT 1 FROM work_activity WHERE property_id = p.property_id AND work_activity_name = 'Harvesting / Picking');
