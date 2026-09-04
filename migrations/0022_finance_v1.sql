PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS finance_season (
  season_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  crop_id INTEGER NOT NULL,
  season_name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','active','closed','archived')),
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id),
  FOREIGN KEY(crop_id) REFERENCES crop_master(crop_id),
  CHECK(date(end_date) >= date(start_date)),
  UNIQUE(property_id,crop_id,season_name)
);

CREATE TABLE IF NOT EXISTS finance_settlement_cycle (
  settlement_cycle_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  cycle_name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK(frequency IN ('weekly','fifteen_day','monthly','custom')),
  custom_days INTEGER CHECK(custom_days IS NULL OR custom_days > 0),
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id),
  CHECK(effective_to IS NULL OR date(effective_to) >= date(effective_from))
);

-- A labour can change between in-house and vendor-provided without changing the
-- historical Property-Labour membership or making one vendor authoritative.
CREATE TABLE IF NOT EXISTS finance_labour_engagement (
  labour_engagement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  labor_id INTEGER NOT NULL,
  labour_type TEXT NOT NULL CHECK(labour_type IN ('in_house','vendor')),
  vendor_id INTEGER,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id),
  FOREIGN KEY(labor_id) REFERENCES labors(labor_id),
  FOREIGN KEY(vendor_id) REFERENCES vendor(vendor_id),
  CHECK((labour_type='vendor' AND vendor_id IS NOT NULL) OR (labour_type='in_house' AND vendor_id IS NULL)),
  CHECK(effective_to IS NULL OR date(effective_to) >= date(effective_from))
);

CREATE TABLE IF NOT EXISTS finance_wage_rule (
  wage_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  season_id INTEGER,
  labor_id INTEGER NOT NULL,
  settlement_cycle_id INTEGER,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  fixed_rate REAL NOT NULL DEFAULT 0 CHECK(fixed_rate >= 0),
  fixed_basis TEXT NOT NULL DEFAULT 'day' CHECK(fixed_basis IN ('day','hour','period')),
  variable_rate REAL NOT NULL DEFAULT 0 CHECK(variable_rate >= 0),
  variable_unit_id INTEGER,
  overtime_rate REAL NOT NULL DEFAULT 0 CHECK(overtime_rate >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  legacy_wage_id INTEGER,
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id),
  FOREIGN KEY(season_id) REFERENCES finance_season(season_id),
  FOREIGN KEY(labor_id) REFERENCES labors(labor_id),
  FOREIGN KEY(settlement_cycle_id) REFERENCES finance_settlement_cycle(settlement_cycle_id),
  FOREIGN KEY(variable_unit_id) REFERENCES baseunit(baseunit_id),
  FOREIGN KEY(legacy_wage_id) REFERENCES wage(wage_id),
  CHECK(effective_to IS NULL OR date(effective_to) >= date(effective_from))
);

CREATE TABLE IF NOT EXISTS finance_yield_type (
  finance_yield_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
  variety_master_id INTEGER NOT NULL,
  yield_type_name TEXT NOT NULL,
  default_unit_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  legacy_yieldtype_id INTEGER,
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(variety_master_id) REFERENCES variety_master(variety_master_id),
  FOREIGN KEY(default_unit_id) REFERENCES baseunit(baseunit_id),
  FOREIGN KEY(legacy_yieldtype_id) REFERENCES yieldtype(yieldtype_id),
  UNIQUE(variety_master_id,yield_type_name)
);

CREATE TABLE IF NOT EXISTS finance_market_rate (
  market_rate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  season_id INTEGER,
  crop_id INTEGER NOT NULL,
  variety_master_id INTEGER NOT NULL,
  finance_yield_type_id INTEGER NOT NULL,
  effective_date TEXT NOT NULL,
  rate REAL NOT NULL CHECK(rate >= 0),
  unit_id INTEGER NOT NULL,
  source_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id),
  FOREIGN KEY(season_id) REFERENCES finance_season(season_id),
  FOREIGN KEY(crop_id) REFERENCES crop_master(crop_id),
  FOREIGN KEY(variety_master_id) REFERENCES variety_master(variety_master_id),
  FOREIGN KEY(finance_yield_type_id) REFERENCES finance_yield_type(finance_yield_type_id),
  FOREIGN KEY(unit_id) REFERENCES baseunit(baseunit_id)
);

CREATE TABLE IF NOT EXISTS finance_buyer_offer (
  buyer_offer_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  season_id INTEGER,
  crop_id INTEGER NOT NULL,
  variety_master_id INTEGER NOT NULL,
  finance_yield_type_id INTEGER NOT NULL,
  buyer_id INTEGER NOT NULL,
  market_rate_id INTEGER,
  offered_rate REAL NOT NULL CHECK(offered_rate >= 0),
  unit_id INTEGER NOT NULL,
  offer_date TEXT NOT NULL,
  valid_until TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','accepted','expired','archived')),
  notes TEXT,
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id),
  FOREIGN KEY(season_id) REFERENCES finance_season(season_id),
  FOREIGN KEY(crop_id) REFERENCES crop_master(crop_id),
  FOREIGN KEY(variety_master_id) REFERENCES variety_master(variety_master_id),
  FOREIGN KEY(finance_yield_type_id) REFERENCES finance_yield_type(finance_yield_type_id),
  FOREIGN KEY(buyer_id) REFERENCES vendor(vendor_id),
  FOREIGN KEY(market_rate_id) REFERENCES finance_market_rate(market_rate_id),
  FOREIGN KEY(unit_id) REFERENCES baseunit(baseunit_id)
);

CREATE TABLE IF NOT EXISTS finance_harvest (
  harvest_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  season_id INTEGER NOT NULL,
  crop_id INTEGER NOT NULL,
  variety_master_id INTEGER NOT NULL,
  finance_yield_type_id INTEGER NOT NULL,
  block_id INTEGER,
  quantity REAL NOT NULL CHECK(quantity > 0),
  unit_id INTEGER NOT NULL,
  harvest_date TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('draft','confirmed','cancelled','reversed')),
  reversal_of_id INTEGER,
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id),
  FOREIGN KEY(season_id) REFERENCES finance_season(season_id),
  FOREIGN KEY(crop_id) REFERENCES crop_master(crop_id),
  FOREIGN KEY(variety_master_id) REFERENCES variety_master(variety_master_id),
  FOREIGN KEY(finance_yield_type_id) REFERENCES finance_yield_type(finance_yield_type_id),
  FOREIGN KEY(block_id) REFERENCES blocks(block_id),
  FOREIGN KEY(unit_id) REFERENCES baseunit(baseunit_id),
  FOREIGN KEY(reversal_of_id) REFERENCES finance_harvest(harvest_id)
);

CREATE TABLE IF NOT EXISTS finance_sale (
  sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  season_id INTEGER NOT NULL,
  crop_id INTEGER NOT NULL,
  variety_master_id INTEGER NOT NULL,
  finance_yield_type_id INTEGER NOT NULL,
  buyer_id INTEGER NOT NULL,
  market_rate_id INTEGER,
  buyer_offer_id INTEGER,
  quantity REAL NOT NULL CHECK(quantity > 0),
  unit_id INTEGER NOT NULL,
  actual_rate REAL NOT NULL CHECK(actual_rate >= 0),
  sale_value REAL NOT NULL CHECK(sale_value >= 0),
  sale_date TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','partial','paid')),
  payment_method TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('draft','confirmed','cancelled','reversed')),
  reversal_of_id INTEGER,
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id),
  FOREIGN KEY(season_id) REFERENCES finance_season(season_id),
  FOREIGN KEY(crop_id) REFERENCES crop_master(crop_id),
  FOREIGN KEY(variety_master_id) REFERENCES variety_master(variety_master_id),
  FOREIGN KEY(finance_yield_type_id) REFERENCES finance_yield_type(finance_yield_type_id),
  FOREIGN KEY(buyer_id) REFERENCES vendor(vendor_id),
  FOREIGN KEY(market_rate_id) REFERENCES finance_market_rate(market_rate_id),
  FOREIGN KEY(buyer_offer_id) REFERENCES finance_buyer_offer(buyer_offer_id),
  FOREIGN KEY(unit_id) REFERENCES baseunit(baseunit_id),
  FOREIGN KEY(reversal_of_id) REFERENCES finance_sale(sale_id)
);

ALTER TABLE running_expenses ADD COLUMN season_id INTEGER REFERENCES finance_season(season_id);
ALTER TABLE running_expenses ADD COLUMN crop_master_id INTEGER REFERENCES crop_master(crop_id);
ALTER TABLE running_expenses ADD COLUMN block_id INTEGER REFERENCES blocks(block_id);
ALTER TABLE running_expenses ADD COLUMN work_activity_id INTEGER REFERENCES work_activity(work_activity_id);
ALTER TABLE running_expenses ADD COLUMN finance_yield_type_id INTEGER REFERENCES finance_yield_type(finance_yield_type_id);
ALTER TABLE running_expenses ADD COLUMN description TEXT;
ALTER TABLE running_expenses ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE running_expenses ADD COLUMN payment_method TEXT;
ALTER TABLE running_expenses ADD COLUMN source_type TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE running_expenses ADD COLUMN source_id INTEGER;
ALTER TABLE running_expenses ADD COLUMN status TEXT NOT NULL DEFAULT 'confirmed';
ALTER TABLE running_expenses ADD COLUMN reversal_of_id INTEGER REFERENCES running_expenses(expense_id);

CREATE TABLE IF NOT EXISTS finance_wage_period (
  wage_period_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  season_id INTEGER,
  labor_id INTEGER NOT NULL,
  wage_rule_id INTEGER NOT NULL,
  settlement_cycle_id INTEGER,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  fixed_earned REAL NOT NULL DEFAULT 0,
  variable_earned REAL NOT NULL DEFAULT 0,
  overtime_earned REAL NOT NULL DEFAULT 0,
  total_earned REAL NOT NULL DEFAULT 0,
  advance_paid REAL NOT NULL DEFAULT 0,
  settled_paid REAL NOT NULL DEFAULT 0,
  outstanding_balance REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','finalized','paid','cancelled','reversed')),
  expense_id INTEGER,
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id),
  FOREIGN KEY(season_id) REFERENCES finance_season(season_id),
  FOREIGN KEY(labor_id) REFERENCES labors(labor_id),
  FOREIGN KEY(wage_rule_id) REFERENCES finance_wage_rule(wage_rule_id),
  FOREIGN KEY(settlement_cycle_id) REFERENCES finance_settlement_cycle(settlement_cycle_id),
  FOREIGN KEY(expense_id) REFERENCES running_expenses(expense_id),
  CHECK(date(period_end) >= date(period_start)),
  CHECK(ABS(total_earned-(advance_paid+settled_paid+outstanding_balance)) < 0.01),
  UNIQUE(property_id,labor_id,period_start,period_end)
);

CREATE TABLE IF NOT EXISTS finance_vendor_commission_rule (
  vendor_commission_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  season_id INTEGER,
  labour_engagement_id INTEGER NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  commission_percentage REAL NOT NULL CHECK(commission_percentage BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id),
  FOREIGN KEY(season_id) REFERENCES finance_season(season_id),
  FOREIGN KEY(labour_engagement_id) REFERENCES finance_labour_engagement(labour_engagement_id),
  CHECK(effective_to IS NULL OR date(effective_to) >= date(effective_from))
);

CREATE TABLE IF NOT EXISTS finance_vendor_period (
  vendor_period_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  season_id INTEGER,
  vendor_id INTEGER NOT NULL,
  labor_id INTEGER NOT NULL,
  wage_period_id INTEGER NOT NULL,
  vendor_commission_rule_id INTEGER NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  eligible_earnings REAL NOT NULL DEFAULT 0,
  commission_percentage REAL NOT NULL DEFAULT 0,
  commission_earned REAL NOT NULL DEFAULT 0,
  paid_amount REAL NOT NULL DEFAULT 0,
  outstanding_balance REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','finalized','paid','cancelled','reversed')),
  expense_id INTEGER,
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY(property_id) REFERENCES property(property_id),
  FOREIGN KEY(season_id) REFERENCES finance_season(season_id),
  FOREIGN KEY(vendor_id) REFERENCES vendor(vendor_id),
  FOREIGN KEY(labor_id) REFERENCES labors(labor_id),
  FOREIGN KEY(wage_period_id) REFERENCES finance_wage_period(wage_period_id),
  FOREIGN KEY(vendor_commission_rule_id) REFERENCES finance_vendor_commission_rule(vendor_commission_rule_id),
  FOREIGN KEY(expense_id) REFERENCES running_expenses(expense_id),
  CHECK(ABS(commission_earned-(paid_amount+outstanding_balance)) < 0.01),
  UNIQUE(wage_period_id,vendor_commission_rule_id)
);

CREATE INDEX IF NOT EXISTS idx_finance_season_property ON finance_season(property_id,status,start_date);
CREATE INDEX IF NOT EXISTS idx_finance_engagement_period ON finance_labour_engagement(property_id,labor_id,effective_from,effective_to);
CREATE INDEX IF NOT EXISTS idx_finance_wage_rule_period ON finance_wage_rule(property_id,labor_id,effective_from,effective_to);
CREATE INDEX IF NOT EXISTS idx_finance_harvest_bucket ON finance_harvest(property_id,season_id,variety_master_id,finance_yield_type_id,unit_id,status);
CREATE INDEX IF NOT EXISTS idx_finance_sale_bucket ON finance_sale(property_id,season_id,variety_master_id,finance_yield_type_id,unit_id,status);
CREATE INDEX IF NOT EXISTS idx_finance_market_history ON finance_market_rate(property_id,season_id,variety_master_id,finance_yield_type_id,effective_date);
CREATE INDEX IF NOT EXISTS idx_finance_expense_season ON running_expenses(property_id,season_id,status,expense_occurence_date);
CREATE UNIQUE INDEX IF NOT EXISTS ux_finance_expense_source ON running_expenses(source_type,source_id) WHERE source_type<>'manual' AND source_id IS NOT NULL AND status<>'reversed';

INSERT INTO expensetype(expense_code,expense_name,current_rate,created_by)
SELECT 'LABOUR','Labour',0,'Finance migration' WHERE NOT EXISTS(SELECT 1 FROM expensetype WHERE expense_code='LABOUR');
INSERT INTO expensetype(expense_code,expense_name,current_rate,created_by)
SELECT 'VENDOR-COMMISSION','Vendor Commission',0,'Finance migration' WHERE NOT EXISTS(SELECT 1 FROM expensetype WHERE expense_code='VENDOR-COMMISSION');
INSERT INTO expensetype(expense_code,expense_name,current_rate,created_by)
SELECT 'PROCESSING','Processing / Work',0,'Finance migration' WHERE NOT EXISTS(SELECT 1 FROM expensetype WHERE expense_code='PROCESSING');
INSERT INTO expensetype(expense_code,expense_name,current_rate,created_by)
SELECT 'IRRIGATION','Sprinkler / Irrigation',0,'Finance migration' WHERE NOT EXISTS(SELECT 1 FROM expensetype WHERE expense_code='IRRIGATION');
INSERT INTO expensetype(expense_code,expense_name,current_rate,created_by)
SELECT 'FUEL','Diesel / Fuel',0,'Finance migration' WHERE NOT EXISTS(SELECT 1 FROM expensetype WHERE expense_code='FUEL');
INSERT INTO expensetype(expense_code,expense_name,current_rate,created_by)
SELECT 'MAINTENANCE','Maintenance',0,'Finance migration' WHERE NOT EXISTS(SELECT 1 FROM expensetype WHERE expense_code='MAINTENANCE');
INSERT INTO expensetype(expense_code,expense_name,current_rate,created_by)
SELECT 'TRANSPORT','Transport',0,'Finance migration' WHERE NOT EXISTS(SELECT 1 FROM expensetype WHERE expense_code='TRANSPORT');
INSERT INTO expensetype(expense_code,expense_name,current_rate,created_by)
SELECT 'MACHINERY','Machinery / Repair',0,'Finance migration' WHERE NOT EXISTS(SELECT 1 FROM expensetype WHERE expense_code='MACHINERY');
INSERT INTO expensetype(expense_code,expense_name,current_rate,created_by)
SELECT 'OTHER','Other',0,'Finance migration' WHERE NOT EXISTS(SELECT 1 FROM expensetype WHERE expense_code='OTHER');

DROP TRIGGER IF EXISTS fertilizer_purchase_ai;
DROP TRIGGER IF EXISTS fertilizer_purchase_au;
DROP TRIGGER IF EXISTS fertilizer_purchase_ad;

CREATE TRIGGER fertilizer_purchase_ai AFTER INSERT ON fertilizer_purchase BEGIN
  INSERT INTO fertilizer_stock_movement(property_id,fertilizer_master_id,movement_date,direction,movement_type,quantity_base,reference_type,reference_id,notes,created_by)
  VALUES(NEW.property_id,NEW.fertilizer_master_id,NEW.purchase_date,'IN','PURCHASE',NEW.quantity_base,'PURCHASE',NEW.fertilizer_purchase_id,NEW.notes,NEW.created_by);
  INSERT INTO running_expenses(expensetype_id,property_id,expense_code,expense_occurence_date,other_expense,description,payment_status,payment_method,source_type,source_id,status,created_by)
  SELECT expensetype_id,NEW.property_id,'Fertilizer purchase' || CASE WHEN NEW.invoice_number IS NOT NULL AND NEW.invoice_number<>'' THEN ' - '||NEW.invoice_number ELSE '' END,NEW.purchase_date,NEW.total_amount,'Fertilizer purchase',NEW.payment_status,NEW.payment_mode,'fertilizer_purchase',NEW.fertilizer_purchase_id,'confirmed',NEW.created_by
  FROM expensetype WHERE expense_code='FERT-PURCHASE' AND NEW.create_expense=1;
  UPDATE fertilizer_purchase SET expense_id=(SELECT expense_id FROM running_expenses WHERE source_type='fertilizer_purchase' AND source_id=NEW.fertilizer_purchase_id) WHERE fertilizer_purchase_id=NEW.fertilizer_purchase_id AND NEW.create_expense=1;
END;

CREATE TRIGGER fertilizer_purchase_au AFTER UPDATE OF property_id,fertilizer_master_id,purchase_date,quantity_base,total_amount,invoice_number,notes,create_expense,payment_status,payment_mode ON fertilizer_purchase BEGIN
  UPDATE fertilizer_stock_movement SET property_id=NEW.property_id,fertilizer_master_id=NEW.fertilizer_master_id,movement_date=NEW.purchase_date,quantity_base=NEW.quantity_base,notes=NEW.notes WHERE reference_type='PURCHASE' AND reference_id=NEW.fertilizer_purchase_id;
  INSERT OR IGNORE INTO running_expenses(expensetype_id,property_id,expense_code,expense_occurence_date,other_expense,description,payment_status,payment_method,source_type,source_id,status,created_by)
  SELECT expensetype_id,NEW.property_id,'Fertilizer purchase',NEW.purchase_date,NEW.total_amount,'Fertilizer purchase',NEW.payment_status,NEW.payment_mode,'fertilizer_purchase',NEW.fertilizer_purchase_id,'confirmed',NEW.created_by FROM expensetype WHERE expense_code='FERT-PURCHASE' AND NEW.create_expense=1;
  UPDATE running_expenses SET property_id=NEW.property_id,expense_code='Fertilizer purchase' || CASE WHEN NEW.invoice_number IS NOT NULL AND NEW.invoice_number<>'' THEN ' - '||NEW.invoice_number ELSE '' END,expense_occurence_date=NEW.purchase_date,other_expense=NEW.total_amount,payment_status=NEW.payment_status,payment_method=NEW.payment_mode,modified_date=CURRENT_TIMESTAMP,modified_by=NEW.modified_by WHERE source_type='fertilizer_purchase' AND source_id=NEW.fertilizer_purchase_id;
  UPDATE fertilizer_purchase SET expense_id=(SELECT expense_id FROM running_expenses WHERE source_type='fertilizer_purchase' AND source_id=NEW.fertilizer_purchase_id) WHERE fertilizer_purchase_id=NEW.fertilizer_purchase_id AND NEW.create_expense=1;
  DELETE FROM running_expenses WHERE source_type='fertilizer_purchase' AND source_id=NEW.fertilizer_purchase_id AND NEW.create_expense=0;
  UPDATE fertilizer_purchase SET expense_id=NULL WHERE fertilizer_purchase_id=NEW.fertilizer_purchase_id AND NEW.create_expense=0;
END;

CREATE TRIGGER fertilizer_purchase_ad AFTER DELETE ON fertilizer_purchase BEGIN
  DELETE FROM fertilizer_stock_movement WHERE reference_type='PURCHASE' AND reference_id=OLD.fertilizer_purchase_id;
  UPDATE running_expenses SET status='reversed',modified_date=CURRENT_TIMESTAMP,modified_by='Fertilizer reversal' WHERE source_type='fertilizer_purchase' AND source_id=OLD.fertilizer_purchase_id;
END;

