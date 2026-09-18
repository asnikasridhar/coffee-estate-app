-- Salary inputs and immutable settlement breakdowns. Apply after 0022.
CREATE TABLE IF NOT EXISTS payroll_rule_detail (
 wage_rule_id INTEGER PRIMARY KEY REFERENCES finance_wage_rule(wage_rule_id) ON DELETE CASCADE,
 included_quantity REAL NOT NULL DEFAULT 0 CHECK(included_quantity>=0),
 prorate_allowance INTEGER NOT NULL DEFAULT 1 CHECK(prorate_allowance IN (0,1))
);
CREATE TABLE IF NOT EXISTS payroll_daily (
 payroll_daily_id INTEGER PRIMARY KEY AUTOINCREMENT,
 property_id INTEGER NOT NULL REFERENCES property(property_id),
 labor_id INTEGER NOT NULL REFERENCES labors(labor_id),
 work_date TEXT NOT NULL,
 quantity REAL NOT NULL DEFAULT 0 CHECK(quantity>=0),
 unit_id INTEGER REFERENCES baseunit(baseunit_id),
 overtime_hours REAL NOT NULL DEFAULT 0 CHECK(overtime_hours>=0 AND overtime_hours<=24),
 notes TEXT, modified_by TEXT, modified_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(property_id,labor_id,work_date), CHECK(quantity=0 OR unit_id IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS payroll_advance (
 advance_id INTEGER PRIMARY KEY AUTOINCREMENT,
 property_id INTEGER NOT NULL REFERENCES property(property_id),
 labor_id INTEGER NOT NULL REFERENCES labors(labor_id),
 paid_date TEXT NOT NULL,
 amount REAL NOT NULL CHECK(amount>0),
 notes TEXT, created_by TEXT, created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payroll_settlement (
 wage_period_id INTEGER PRIMARY KEY REFERENCES finance_wage_period(wage_period_id),
 breakdown_json TEXT NOT NULL,
 payment_method TEXT NOT NULL DEFAULT 'cash',
 settled_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payroll_advance_recovery (
 wage_period_id INTEGER NOT NULL REFERENCES finance_wage_period(wage_period_id),
 advance_id INTEGER NOT NULL REFERENCES payroll_advance(advance_id),
 amount REAL NOT NULL CHECK(amount>0),
 PRIMARY KEY(wage_period_id,advance_id)
);
CREATE TRIGGER IF NOT EXISTS payroll_recovery_limit BEFORE INSERT ON payroll_advance_recovery BEGIN
 SELECT CASE WHEN NEW.amount + COALESCE((SELECT SUM(amount) FROM payroll_advance_recovery WHERE advance_id=NEW.advance_id),0) > (SELECT amount FROM payroll_advance WHERE advance_id=NEW.advance_id)+0.001 THEN RAISE(ABORT,'Advance already recovered; refresh salary preview') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM payroll_advance a JOIN finance_wage_period w ON w.wage_period_id=NEW.wage_period_id AND w.property_id=a.property_id AND w.labor_id=a.labor_id WHERE a.advance_id=NEW.advance_id) THEN RAISE(ABORT,'Advance does not belong to this salary') END;
END;
CREATE TRIGGER IF NOT EXISTS payroll_no_overlap BEFORE INSERT ON finance_wage_period
WHEN NEW.status IN ('paid','finalized') BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM finance_wage_period w WHERE w.property_id=NEW.property_id AND w.labor_id=NEW.labor_id AND w.status IN ('paid','finalized') AND w.period_start<=NEW.period_end AND w.period_end>=NEW.period_start) THEN RAISE(ABORT,'Salary already settled for overlapping dates') END;
END;
CREATE TRIGGER IF NOT EXISTS payroll_no_overlap_update BEFORE UPDATE OF status,period_start,period_end ON finance_wage_period
WHEN NEW.status IN ('paid','finalized') BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM finance_wage_period w WHERE w.wage_period_id<>NEW.wage_period_id AND w.property_id=NEW.property_id AND w.labor_id=NEW.labor_id AND w.status IN ('paid','finalized') AND w.period_start<=NEW.period_end AND w.period_end>=NEW.period_start) THEN RAISE(ABORT,'Salary already settled for overlapping dates') END;
END;
CREATE INDEX IF NOT EXISTS payroll_daily_period ON payroll_daily(property_id,work_date,labor_id);
CREATE INDEX IF NOT EXISTS payroll_advance_person ON payroll_advance(property_id,labor_id,paid_date);

CREATE TRIGGER IF NOT EXISTS payroll_daily_settled_insert BEFORE INSERT ON payroll_daily BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM finance_wage_period w WHERE w.property_id=NEW.property_id AND w.labor_id=NEW.labor_id AND w.status IN ('paid','finalized') AND w.period_start<=NEW.work_date AND w.period_end>=NEW.work_date) THEN RAISE(ABORT,'Daily salary is already settled') END;
END;
CREATE TRIGGER IF NOT EXISTS payroll_daily_settled_update BEFORE UPDATE ON payroll_daily BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM finance_wage_period w WHERE w.property_id=OLD.property_id AND w.labor_id=OLD.labor_id AND w.status IN ('paid','finalized') AND w.period_start<=OLD.work_date AND w.period_end>=OLD.work_date) THEN RAISE(ABORT,'Daily salary is already settled') END;
END;
