-- Append-only estate rates and immutable daily salary payments. After 0024.
CREATE TABLE estate_rate_version (
 rate_version_id INTEGER PRIMARY KEY AUTOINCREMENT,
 property_id INTEGER NOT NULL REFERENCES property(property_id),
 category TEXT NOT NULL CHECK(category IN ('daily','work','seasonal','overtime')),
 effective_from TEXT NOT NULL,
 effective_to TEXT NOT NULL,
 payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
 created_by TEXT NOT NULL,
 created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(date(effective_from) IS NOT NULL AND date(effective_to) IS NOT NULL AND effective_to>=effective_from)
);
CREATE INDEX estate_rate_dates ON estate_rate_version(property_id,category,effective_from,effective_to);
CREATE TRIGGER estate_rate_overlap BEFORE INSERT ON estate_rate_version BEGIN
 SELECT RAISE(ABORT,'Rate dates overlap an existing version') WHERE EXISTS(SELECT 1 FROM estate_rate_version r WHERE r.property_id=NEW.property_id AND r.category=NEW.category AND r.effective_from<=NEW.effective_to AND r.effective_to>=NEW.effective_from);
END;
CREATE TRIGGER estate_rate_immutable_update BEFORE UPDATE ON estate_rate_version BEGIN
 SELECT RAISE(ABORT,'Rate versions are immutable. Create a new date range');
END;
CREATE TRIGGER estate_rate_immutable_delete BEFORE DELETE ON estate_rate_version BEGIN
 SELECT RAISE(ABORT,'Historical rate versions cannot be deleted');
END;
CREATE TABLE estate_overtime_type (
 overtime_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
 property_id INTEGER NOT NULL REFERENCES property(property_id),
 name TEXT NOT NULL,
 unit TEXT NOT NULL,
 UNIQUE(property_id,name)
);
CREATE TABLE estate_salary_input (
 property_id INTEGER NOT NULL REFERENCES property(property_id),
 labor_id INTEGER NOT NULL REFERENCES labors(labor_id),
 work_date TEXT NOT NULL,
 input_json TEXT NOT NULL CHECK(json_valid(input_json)),
 modified_by TEXT NOT NULL,
 modified_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(property_id,labor_id,work_date)
);
CREATE TABLE estate_salary_override (
 override_id INTEGER PRIMARY KEY AUTOINCREMENT,
 property_id INTEGER NOT NULL REFERENCES property(property_id),
 labor_id INTEGER NOT NULL REFERENCES labors(labor_id),
 work_date TEXT NOT NULL,
 component TEXT NOT NULL CHECK(component IN ('fixed_earned','work_earned','variable_earned','overtime_earned','custom_earned','advance_paid')),
 original_amount REAL NOT NULL CHECK(original_amount>=0),
 override_amount REAL NOT NULL CHECK(override_amount>=0),
 reason TEXT NOT NULL CHECK(length(trim(reason))>0),
 created_by TEXT NOT NULL,
 created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE estate_salary_payment (
 payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
 season_id INTEGER REFERENCES finance_season(season_id),
 property_id INTEGER NOT NULL REFERENCES property(property_id),
 labor_id INTEGER NOT NULL REFERENCES labors(labor_id),
 work_date TEXT NOT NULL,
 payment_date TEXT NOT NULL,
 payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','bank','upi')),
 earned REAL NOT NULL CHECK(earned>=0),
 advances REAL NOT NULL CHECK(advances>=0),
 payable REAL NOT NULL CHECK(payable>=0),
 snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)),
 paid_by TEXT NOT NULL,
 paid_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(property_id,labor_id,work_date),
 CHECK(ABS(earned-advances-payable)<0.01)
);
CREATE TABLE estate_advance_recovery (
 payment_id INTEGER NOT NULL REFERENCES estate_salary_payment(payment_id),
 advance_id INTEGER NOT NULL REFERENCES payroll_advance(advance_id),
 amount REAL NOT NULL CHECK(amount>0),
 PRIMARY KEY(payment_id,advance_id)
);
CREATE TRIGGER estate_payment_legacy_overlap BEFORE INSERT ON estate_salary_payment BEGIN
 SELECT RAISE(ABORT,'Salary already settled for overlapping dates') WHERE EXISTS(SELECT 1 FROM finance_wage_period w WHERE w.property_id=NEW.property_id AND w.labor_id=NEW.labor_id AND w.status IN ('paid','finalized') AND w.period_start<=NEW.work_date AND w.period_end>=NEW.work_date);
END;
CREATE TRIGGER estate_legacy_payment_overlap BEFORE INSERT ON finance_wage_period WHEN NEW.status IN ('paid','finalized') BEGIN
 SELECT RAISE(ABORT,'Salary already settled for overlapping dates') WHERE EXISTS(SELECT 1 FROM estate_salary_payment p WHERE p.property_id=NEW.property_id AND p.labor_id=NEW.labor_id AND p.work_date BETWEEN NEW.period_start AND NEW.period_end);
END;
CREATE TRIGGER estate_legacy_payment_overlap_update BEFORE UPDATE OF status,period_start,period_end ON finance_wage_period WHEN NEW.status IN ('paid','finalized') BEGIN
 SELECT RAISE(ABORT,'Salary already settled for overlapping dates') WHERE EXISTS(SELECT 1 FROM estate_salary_payment p WHERE p.property_id=NEW.property_id AND p.labor_id=NEW.labor_id AND p.work_date BETWEEN NEW.period_start AND NEW.period_end);
END;
CREATE TRIGGER estate_recovery_limit BEFORE INSERT ON estate_advance_recovery BEGIN
 SELECT RAISE(ABORT,'Advance already recovered. Refresh salary preview') WHERE NEW.amount+COALESCE((SELECT SUM(amount) FROM estate_advance_recovery WHERE advance_id=NEW.advance_id),0)+COALESCE((SELECT SUM(amount) FROM payroll_advance_recovery WHERE advance_id=NEW.advance_id),0)>(SELECT amount FROM payroll_advance WHERE advance_id=NEW.advance_id)+0.001;
 SELECT RAISE(ABORT,'Advance does not belong to this salary') WHERE NOT EXISTS(SELECT 1 FROM payroll_advance a JOIN estate_salary_payment p ON p.payment_id=NEW.payment_id AND p.property_id=a.property_id AND p.labor_id=a.labor_id WHERE a.advance_id=NEW.advance_id);
END;
CREATE TRIGGER estate_legacy_recovery_limit BEFORE INSERT ON payroll_advance_recovery BEGIN
 SELECT RAISE(ABORT,'Advance already recovered. Refresh salary preview') WHERE NEW.amount+COALESCE((SELECT SUM(amount) FROM estate_advance_recovery WHERE advance_id=NEW.advance_id),0)+COALESCE((SELECT SUM(amount) FROM payroll_advance_recovery WHERE advance_id=NEW.advance_id),0)>(SELECT amount FROM payroll_advance WHERE advance_id=NEW.advance_id)+0.001;
END;
CREATE TRIGGER estate_payment_no_update BEFORE UPDATE ON estate_salary_payment BEGIN
 SELECT RAISE(ABORT,'Paid salary snapshots are immutable');
END;
CREATE TRIGGER estate_payment_no_delete BEFORE DELETE ON estate_salary_payment BEGIN
 SELECT RAISE(ABORT,'Paid salary snapshots are immutable');
END;
CREATE TRIGGER estate_override_no_update BEFORE UPDATE ON estate_salary_override BEGIN
 SELECT RAISE(ABORT,'Override audit records are immutable');
END;
CREATE TRIGGER estate_override_no_delete BEFORE DELETE ON estate_salary_override BEGIN
 SELECT RAISE(ABORT,'Override audit records are immutable');
END;
CREATE TRIGGER estate_recovery_no_update BEFORE UPDATE ON estate_advance_recovery BEGIN
 SELECT RAISE(ABORT,'Paid advance recoveries are immutable');
END;
CREATE TRIGGER estate_recovery_no_delete BEFORE DELETE ON estate_advance_recovery BEGIN
 SELECT RAISE(ABORT,'Paid advance recoveries are immutable');
END;

CREATE TRIGGER estate_salary_input_paid_insert BEFORE INSERT ON estate_salary_input BEGIN
 SELECT RAISE(ABORT,'Salary is already paid') WHERE EXISTS(SELECT 1 FROM estate_salary_payment p WHERE p.property_id=NEW.property_id AND p.labor_id=NEW.labor_id AND p.work_date=NEW.work_date) OR EXISTS(SELECT 1 FROM finance_wage_period w WHERE w.property_id=NEW.property_id AND w.labor_id=NEW.labor_id AND NEW.work_date BETWEEN w.period_start AND w.period_end AND w.status IN ('paid','finalized'));
END;

CREATE TRIGGER estate_salary_input_paid_update BEFORE UPDATE ON estate_salary_input BEGIN
 SELECT RAISE(ABORT,'Salary is already paid') WHERE EXISTS(SELECT 1 FROM estate_salary_payment p WHERE p.property_id=NEW.property_id AND p.labor_id=NEW.labor_id AND p.work_date=NEW.work_date) OR EXISTS(SELECT 1 FROM finance_wage_period w WHERE w.property_id=NEW.property_id AND w.labor_id=NEW.labor_id AND NEW.work_date BETWEEN w.period_start AND w.period_end AND w.status IN ('paid','finalized'));
END;

CREATE TRIGGER estate_salary_override_paid_insert BEFORE INSERT ON estate_salary_override BEGIN
 SELECT RAISE(ABORT,'Salary is already paid') WHERE EXISTS(SELECT 1 FROM estate_salary_payment p WHERE p.property_id=NEW.property_id AND p.labor_id=NEW.labor_id AND p.work_date=NEW.work_date) OR EXISTS(SELECT 1 FROM finance_wage_period w WHERE w.property_id=NEW.property_id AND w.labor_id=NEW.labor_id AND NEW.work_date BETWEEN w.period_start AND w.period_end AND w.status IN ('paid','finalized'));
END;

CREATE TRIGGER payroll_snapshot_no_update BEFORE UPDATE ON payroll_settlement BEGIN
 SELECT RAISE(ABORT,'Paid salary snapshots are immutable');
END;

CREATE TRIGGER payroll_snapshot_no_delete BEFORE DELETE ON payroll_settlement BEGIN
 SELECT RAISE(ABORT,'Paid salary snapshots are immutable');
END;

CREATE VIEW payroll_recoveries_all AS SELECT advance_id,amount FROM payroll_advance_recovery UNION ALL SELECT advance_id,amount FROM estate_advance_recovery;
CREATE TRIGGER estate_daily_paid_insert BEFORE INSERT ON payroll_daily BEGIN
 SELECT RAISE(ABORT,'Daily salary is already settled') WHERE EXISTS(SELECT 1 FROM estate_salary_payment p WHERE p.property_id=NEW.property_id AND p.labor_id=NEW.labor_id AND p.work_date=NEW.work_date);
END;
CREATE TRIGGER estate_daily_paid_update BEFORE UPDATE ON payroll_daily BEGIN
 SELECT RAISE(ABORT,'Daily salary is already settled') WHERE EXISTS(SELECT 1 FROM estate_salary_payment p WHERE p.property_id=NEW.property_id AND p.labor_id=NEW.labor_id AND p.work_date=NEW.work_date);
END;
CREATE TRIGGER legacy_wage_version_no_update BEFORE UPDATE ON finance_wage_rule BEGIN
 SELECT RAISE(ABORT,'Historical wage rates are immutable. Create a new version');
END;
CREATE TRIGGER legacy_wage_version_no_delete BEFORE DELETE ON finance_wage_rule BEGIN
 SELECT RAISE(ABORT,'Historical wage rates are immutable. Create a new version');
END;
