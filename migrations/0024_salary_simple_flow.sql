-- Apply once after 0023_labour_payroll.sql.
ALTER TABLE work_assignment ADD COLUMN work_quantity REAL CHECK(work_quantity IS NULL OR work_quantity>=0);
ALTER TABLE work_assignment ADD COLUMN work_unit TEXT CHECK(work_unit IS NULL OR work_unit IN ('acre','tree','day','kg','bushel'));
CREATE TABLE payroll_rule_options (
 wage_rule_id INTEGER PRIMARY KEY REFERENCES finance_wage_rule(wage_rule_id) ON DELETE CASCADE,
 work_rates_json TEXT NOT NULL DEFAULT '[]',
 bonus_quantity REAL NOT NULL DEFAULT 1 CHECK(bonus_quantity>0),
 bonus_mode TEXT NOT NULL DEFAULT 'proportional' CHECK(bonus_mode IN ('proportional','complete'))
);
CREATE TABLE payroll_daily_extra (
 payroll_daily_id INTEGER PRIMARY KEY REFERENCES payroll_daily(payroll_daily_id) ON DELETE CASCADE,
 custom_amount REAL NOT NULL DEFAULT 0 CHECK(custom_amount>=0)
);
CREATE TABLE payroll_advance_reason (
 advance_id INTEGER PRIMARY KEY REFERENCES payroll_advance(advance_id) ON DELETE CASCADE,
 reason TEXT NOT NULL DEFAULT 'Other'
);
CREATE TABLE payroll_payment_detail (
 wage_period_id INTEGER PRIMARY KEY REFERENCES finance_wage_period(wage_period_id),
 payment_date TEXT NOT NULL
);
