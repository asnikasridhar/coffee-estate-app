CREATE TABLE work_assignment_new (
  work_assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  work_activity_id INTEGER NOT NULL,
  labor_id INTEGER NOT NULL,
  work_date TEXT NOT NULL,
  block_id INTEGER,
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

INSERT INTO work_assignment_new (
  work_assignment_id, property_id, work_activity_id, labor_id, work_date,
  block_id, notes, created_on, created_by, modified_on, modified_by
)
SELECT work_assignment_id, property_id, work_activity_id, labor_id, work_date,
       block_id, notes, created_on, created_by, modified_on, modified_by
FROM work_assignment;

DROP TABLE work_assignment;
ALTER TABLE work_assignment_new RENAME TO work_assignment;

CREATE INDEX idx_work_assignment_property_date ON work_assignment(property_id, work_date);
CREATE INDEX idx_work_assignment_activity ON work_assignment(work_activity_id);
CREATE INDEX idx_work_assignment_block ON work_assignment(block_id);
CREATE INDEX idx_work_assignment_labor ON work_assignment(labor_id);

CREATE UNIQUE INDEX ux_work_assignment_day_labor_activity_block
ON work_assignment(property_id, work_date, labor_id, work_activity_id, COALESCE(block_id,0));

CREATE TRIGGER trg_work_assignment_requires_attendance
BEFORE INSERT ON work_assignment
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1 FROM attendance a
  WHERE a.property_id = NEW.property_id
    AND a.labor_id = NEW.labor_id
    AND date(a.entry_date) = date(NEW.work_date)
    AND a.attendance_value > 0
)
BEGIN
  SELECT RAISE(ABORT, 'Labor must have attendance for this property and work date before assigning work activity');
END;

CREATE TRIGGER trg_work_assignment_block_property
BEFORE INSERT ON work_assignment
FOR EACH ROW
WHEN NEW.block_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM blocks b
  WHERE b.block_id = NEW.block_id
    AND b.property_id = NEW.property_id
)
BEGIN
  SELECT RAISE(ABORT, 'Selected block does not belong to this property');
END;

CREATE TRIGGER trg_work_assignment_activity_property
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

CREATE TRIGGER trg_work_assignment_requires_attendance_update
BEFORE UPDATE ON work_assignment
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1 FROM attendance a
  WHERE a.property_id = NEW.property_id
    AND a.labor_id = NEW.labor_id
    AND date(a.entry_date) = date(NEW.work_date)
    AND a.attendance_value > 0
)
BEGIN
  SELECT RAISE(ABORT, 'Labor must have attendance for this property and work date before assigning work activity');
END;

CREATE TRIGGER trg_work_assignment_block_property_update
BEFORE UPDATE ON work_assignment
FOR EACH ROW
WHEN NEW.block_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM blocks b
  WHERE b.block_id = NEW.block_id
    AND b.property_id = NEW.property_id
)
BEGIN
  SELECT RAISE(ABORT, 'Selected block does not belong to this property');
END;

CREATE TRIGGER trg_work_assignment_activity_property_update
BEFORE UPDATE ON work_assignment
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1 FROM work_activity wa
  WHERE wa.work_activity_id = NEW.work_activity_id
    AND wa.property_id = NEW.property_id
)
BEGIN
  SELECT RAISE(ABORT, 'Selected work activity does not belong to this property');
END;
