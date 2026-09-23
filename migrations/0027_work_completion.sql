-- Actual work is recorded separately from the morning assignment.
CREATE TABLE work_completion (
 work_assignment_id INTEGER PRIMARY KEY REFERENCES work_assignment(work_assignment_id),
 actual_quantity REAL NOT NULL CHECK(actual_quantity>=0),
 actual_unit TEXT NOT NULL,
 rate_override REAL CHECK(rate_override IS NULL OR rate_override>=0),
 reason TEXT NOT NULL DEFAULT '',
 notes TEXT NOT NULL DEFAULT '',
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>0),
 assignment_key TEXT NOT NULL,
 modified_by TEXT NOT NULL,
 modified_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(rate_override IS NULL OR length(trim(reason))>0)
);
CREATE TABLE work_completion_audit (
 audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
 work_assignment_id INTEGER NOT NULL,
 detail_json TEXT NOT NULL,
 changed_by TEXT NOT NULL,
 changed_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER work_completion_revision BEFORE UPDATE ON work_completion BEGIN
 SELECT RAISE(ABORT,'Work completion changed elsewhere. Refresh before saving.') WHERE NEW.revision<>OLD.revision+1;
END;
CREATE TRIGGER work_completion_assignment_insert BEFORE INSERT ON work_completion BEGIN
 SELECT RAISE(ABORT,'Assignment changed. Refresh Work Completion.') WHERE NEW.assignment_key<>(SELECT json_array(work_assignment_id,property_id,labor_id,work_date,work_activity_id,block_id,work_quantity,work_unit) FROM work_assignment WHERE work_assignment_id=NEW.work_assignment_id);
 SELECT RAISE(ABORT,'Salary is already paid') WHERE EXISTS(SELECT 1 FROM work_assignment a JOIN estate_salary_payment p ON p.property_id=a.property_id AND p.labor_id=a.labor_id AND p.work_date=date(a.work_date) WHERE a.work_assignment_id=NEW.work_assignment_id) OR EXISTS(SELECT 1 FROM work_assignment a JOIN finance_wage_period p ON p.property_id=a.property_id AND p.labor_id=a.labor_id AND date(a.work_date) BETWEEN p.period_start AND p.period_end AND p.status IN ('paid','finalized') WHERE a.work_assignment_id=NEW.work_assignment_id);
END;
CREATE TRIGGER work_completion_paid_update BEFORE UPDATE ON work_completion BEGIN
 SELECT RAISE(ABORT,'Salary is already paid') WHERE EXISTS(SELECT 1 FROM work_assignment a JOIN estate_salary_payment p ON p.property_id=a.property_id AND p.labor_id=a.labor_id AND p.work_date=date(a.work_date) WHERE a.work_assignment_id=OLD.work_assignment_id) OR EXISTS(SELECT 1 FROM work_assignment a JOIN finance_wage_period p ON p.property_id=a.property_id AND p.labor_id=a.labor_id AND date(a.work_date) BETWEEN p.period_start AND p.period_end AND p.status IN ('paid','finalized') WHERE a.work_assignment_id=OLD.work_assignment_id);
END;
CREATE TRIGGER work_completion_no_delete BEFORE DELETE ON work_completion BEGIN
 SELECT RAISE(ABORT,'Correct the actual completion instead of deleting its record');
END;
CREATE TRIGGER completed_assignment_no_change BEFORE UPDATE OF property_id,labor_id,work_date,work_activity_id,block_id,work_quantity,work_unit ON work_assignment WHEN EXISTS(SELECT 1 FROM work_completion WHERE work_assignment_id=OLD.work_assignment_id) BEGIN
 SELECT RAISE(ABORT,'Completion is recorded. Correct actuals in Work Completion.') WHERE NEW.property_id IS NOT OLD.property_id OR NEW.labor_id IS NOT OLD.labor_id OR NEW.work_date IS NOT OLD.work_date OR NEW.work_activity_id IS NOT OLD.work_activity_id OR NEW.block_id IS NOT OLD.block_id OR NEW.work_quantity IS NOT OLD.work_quantity OR NEW.work_unit IS NOT OLD.work_unit;
END;
CREATE TRIGGER work_completion_log_insert AFTER INSERT ON work_completion BEGIN
 INSERT INTO work_completion_audit(work_assignment_id,detail_json,changed_by) VALUES(NEW.work_assignment_id,json_object('quantity',NEW.actual_quantity,'unit',NEW.actual_unit,'rate_override',NEW.rate_override,'reason',NEW.reason,'notes',NEW.notes,'revision',NEW.revision),NEW.modified_by);
END;
CREATE TRIGGER work_completion_log_update AFTER UPDATE ON work_completion BEGIN
 INSERT INTO work_completion_audit(work_assignment_id,detail_json,changed_by) VALUES(NEW.work_assignment_id,json_object('previous_quantity',OLD.actual_quantity,'previous_rate_override',OLD.rate_override,'quantity',NEW.actual_quantity,'unit',NEW.actual_unit,'rate_override',NEW.rate_override,'reason',NEW.reason,'notes',NEW.notes,'revision',NEW.revision),NEW.modified_by);
END;
CREATE TRIGGER work_completion_audit_no_update BEFORE UPDATE ON work_completion_audit BEGIN
 SELECT RAISE(ABORT,'Completion audit is immutable');
END;
CREATE TRIGGER work_completion_audit_no_delete BEFORE DELETE ON work_completion_audit BEGIN
 SELECT RAISE(ABORT,'Completion audit is immutable');
END;
CREATE TRIGGER paid_assignment_no_insert BEFORE INSERT ON work_assignment BEGIN
 SELECT RAISE(ABORT,'Salary is already paid') WHERE EXISTS(SELECT 1 FROM estate_salary_payment p WHERE p.property_id=NEW.property_id AND p.labor_id=NEW.labor_id AND p.work_date=date(NEW.work_date)) OR EXISTS(SELECT 1 FROM finance_wage_period p WHERE p.property_id=NEW.property_id AND p.labor_id=NEW.labor_id AND date(NEW.work_date) BETWEEN p.period_start AND p.period_end AND p.status IN ('paid','finalized'));
END;
CREATE TRIGGER paid_assignment_no_delete BEFORE DELETE ON work_assignment BEGIN
 SELECT RAISE(ABORT,'Salary is already paid') WHERE EXISTS(SELECT 1 FROM estate_salary_payment p WHERE p.property_id=OLD.property_id AND p.labor_id=OLD.labor_id AND p.work_date=date(OLD.work_date)) OR EXISTS(SELECT 1 FROM finance_wage_period p WHERE p.property_id=OLD.property_id AND p.labor_id=OLD.labor_id AND date(OLD.work_date) BETWEEN p.period_start AND p.period_end AND p.status IN ('paid','finalized'));
END;
CREATE TRIGGER salary_completion_consistent BEFORE INSERT ON estate_salary_payment BEGIN
 SELECT RAISE(ABORT,'Work completion changed. Refresh salary before payment.') WHERE EXISTS(
  SELECT 1 FROM work_assignment a LEFT JOIN work_completion c ON c.work_assignment_id=a.work_assignment_id
  WHERE a.property_id=NEW.property_id AND a.labor_id=NEW.labor_id AND date(a.work_date)=NEW.work_date
  AND (c.work_assignment_id IS NULL OR NOT EXISTS(SELECT 1 FROM json_each(NEW.snapshot_json,'$.work_charges') w WHERE json_extract(w.value,'$.work_assignment_id')=a.work_assignment_id AND json_extract(w.value,'$.completion.revision')=c.revision))
 );
END;
