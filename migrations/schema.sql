PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS attendance;

CREATE TABLE attendance (
  attendance_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  labor_id INTEGER NOT NULL,
  property_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  entry_date TEXT NOT NULL,
  created_by TEXT NOT NULL,
  modified_by TEXT DEFAULT NULL,
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_on TEXT DEFAULT NULL,
  attendance_value NUMERIC DEFAULT '0.00',
  FOREIGN KEY (labor_id) REFERENCES labors (labor_id),
  FOREIGN KEY (property_id) REFERENCES property (property_id),
  FOREIGN KEY (user_id) REFERENCES users (user_id)
);

DROP TABLE IF EXISTS baseunit;

CREATE TABLE baseunit (
  baseunit_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  baseunit_name TEXT NOT NULL,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_date TEXT DEFAULT CURRENT_TIMESTAMP,
  modified_by TEXT DEFAULT NULL
);

DROP TABLE IF EXISTS blocks;

CREATE TABLE blocks (
  block_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  block_name TEXT NOT NULL,
  block_area REAL DEFAULT NULL,
  property_id INTEGER DEFAULT NULL,
  parent_block_id INTEGER DEFAULT NULL,
  FOREIGN KEY (property_id) REFERENCES property (property_id),
  FOREIGN KEY (parent_block_id) REFERENCES blocks (block_id) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS crop_income;

CREATE TABLE crop_income (
  income_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  crop_id INTEGER DEFAULT NULL,
  income_amount NUMERIC DEFAULT NULL,
  received_date text,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_date TEXT DEFAULT CURRENT_TIMESTAMP,
  modified_by TEXT DEFAULT NULL,
  FOREIGN KEY (crop_id) REFERENCES cropdetails (crop_id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS cropdetails;

CREATE TABLE cropdetails (
  crop_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  yield_obtained REAL DEFAULT NULL,
  selling_price REAL DEFAULT NULL,
  property_id INTEGER DEFAULT NULL,
  created_on TEXT DEFAULT NULL,
  created_by TEXT DEFAULT NULL,
  modified_on TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL,
  other_detail TEXT DEFAULT NULL,
  FOREIGN KEY (property_id) REFERENCES property (property_id)
);

DROP TABLE IF EXISTS currentasset;

CREATE TABLE currentasset (
  currentasset_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  asset_name TEXT NOT NULL,
  asset_price REAL NOT NULL,
  procured_year INTEGER DEFAULT NULL,
  isactive INTEGER DEFAULT '1',
  property_id INTEGER NOT NULL,
  asset_procured_source TEXT DEFAULT NULL,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_date TEXT DEFAULT CURRENT_TIMESTAMP,
  modified_by TEXT DEFAULT NULL,
  FOREIGN KEY (property_id) REFERENCES property (property_id)
);

DROP TABLE IF EXISTS expensetype;

CREATE TABLE expensetype (
  expensetype_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  expense_code TEXT NOT NULL,
  expense_name TEXT NOT NULL,
  current_rate REAL DEFAULT NULL,
  baseunit_id INTEGER DEFAULT NULL,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_date TEXT DEFAULT CURRENT_TIMESTAMP,
  modified_by TEXT DEFAULT NULL,
  UNIQUE (expense_code),
  FOREIGN KEY (baseunit_id) REFERENCES baseunit (baseunit_id) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS fertilizers;

CREATE TABLE fertilizers (
  fertilizer_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  fertilizer_name TEXT DEFAULT NULL,
  date_of_application date DEFAULT NULL,
  property_id INTEGER DEFAULT NULL,
  created_on TEXT DEFAULT NULL,
  created_by TEXT DEFAULT NULL,
  modified_on TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL,
  other_details TEXT DEFAULT NULL,
  FOREIGN KEY (property_id) REFERENCES property (property_id)
);

DROP TABLE IF EXISTS labors;

CREATE TABLE labors (
  labor_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER DEFAULT NULL,
  name TEXT NOT NULL,
  age INTEGER DEFAULT NULL,
  adhar_card TEXT DEFAULT NULL,
  bank_details TEXT DEFAULT NULL,
  health_history text,
  photo blob,
  address TEXT DEFAULT NULL,
  emergency_details TEXT DEFAULT NULL,
  created_on TEXT DEFAULT NULL,
  created_by TEXT DEFAULT NULL,
  modified_on TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL
);

DROP TABLE IF EXISTS laborvendor;

CREATE TABLE laborvendor (
  laborvendor_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  labor_id INTEGER NOT NULL,
  vendor_id INTEGER NOT NULL,
  vendor_labor_percentage NUMERIC DEFAULT NULL,
  laborvendorcode TEXT NOT NULL,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_on TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL,
  UNIQUE (laborvendorcode),
  FOREIGN KEY (labor_id) REFERENCES labors (labor_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendor (vendor_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT laborvendor_chk_1 CHECK ((vendor_labor_percentage between 0 and 100))
);

DROP TABLE IF EXISTS laborvendor_settlement;

CREATE TABLE laborvendor_settlement (
  laborvendor_settlement_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  laborvendor_id INTEGER NOT NULL,
  settled_amount NUMERIC DEFAULT '0.00',
  advance_amount NUMERIC DEFAULT '0.00',
  running_wage_transaction_date date NOT NULL,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_on TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL,
  FOREIGN KEY (laborvendor_id) REFERENCES laborvendor (laborvendor_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS plantdetails;

CREATE TABLE plantdetails (
  plant_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  plant_type TEXT NOT NULL,
  details text,
  block_id INTEGER DEFAULT NULL,
  plantdetailscol TEXT DEFAULT NULL,
  created_on TEXT DEFAULT NULL,
  created_by TEXT DEFAULT NULL,
  modified_on TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL,
  FOREIGN KEY (block_id) REFERENCES blocks (block_id)
);

DROP TABLE IF EXISTS property;

CREATE TABLE property (
  property_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  property_name TEXT NOT NULL,
  total_acre REAL DEFAULT NULL,
  address_1 TEXT DEFAULT NULL,
  address_2 TEXT DEFAULT NULL,
  pincode TEXT DEFAULT NULL,
  user_id INTEGER DEFAULT NULL,
  created_on TEXT DEFAULT NULL,
  created_by TEXT DEFAULT NULL,
  modified_on TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users (user_id)
);

DROP TABLE IF EXISTS propertylabor;

CREATE TABLE propertylabor (
  property_id INTEGER DEFAULT NULL,
  labor_id INTEGER DEFAULT NULL,
  FOREIGN KEY (property_id) REFERENCES property (property_id),
  FOREIGN KEY (labor_id) REFERENCES labors (labor_id)
);

DROP TABLE IF EXISTS propertyuser;

CREATE TABLE propertyuser (
  property_id INTEGER DEFAULT NULL,
  user_id INTEGER DEFAULT NULL,
  FOREIGN KEY (property_id) REFERENCES property (property_id),
  FOREIGN KEY (user_id) REFERENCES users (user_id)
);

DROP TABLE IF EXISTS raindetails;

CREATE TABLE raindetails (
  rain_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  date_time TEXT DEFAULT NULL,
  rain_amount REAL DEFAULT NULL,
  block_id INTEGER DEFAULT NULL,
  created_on TEXT DEFAULT NULL,
  created_by TEXT DEFAULT NULL,
  modified_on TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL,
  FOREIGN KEY (block_id) REFERENCES blocks (block_id)
);

DROP TABLE IF EXISTS reports;

CREATE TABLE reports (
  report_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  total_expenditure REAL DEFAULT NULL,
  total_revenue REAL DEFAULT NULL,
  profit_loss REAL DEFAULT NULL,
  property_id INTEGER DEFAULT NULL,
  created_on TEXT DEFAULT NULL,
  created_by TEXT DEFAULT NULL,
  modified_on TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL,
  FOREIGN KEY (property_id) REFERENCES property (property_id)
);

DROP TABLE IF EXISTS running_expenses;

CREATE TABLE running_expenses (
  expense_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  expensetype_id INTEGER NOT NULL,
  property_id INTEGER NOT NULL,
  expense_code TEXT DEFAULT NULL,
  expense_occurence_date date NOT NULL,
  other_expense REAL DEFAULT NULL,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_date TEXT DEFAULT CURRENT_TIMESTAMP,
  modified_by TEXT DEFAULT NULL,
  FOREIGN KEY (expensetype_id) REFERENCES expensetype (expensetype_id),
  FOREIGN KEY (property_id) REFERENCES property (property_id)
);

DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active INTEGER DEFAULT '1',
  email TEXT DEFAULT NULL,
  created_on TEXT DEFAULT NULL,
  created_by TEXT DEFAULT NULL,
  modified_on TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL,
  UNIQUE (username)
);

DROP TABLE IF EXISTS vendor;

CREATE TABLE vendor (
  vendor_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  vendorname TEXT NOT NULL,
  description text,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_on TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL
);

DROP TABLE IF EXISTS wage;

CREATE TABLE wage (
  wage_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  wage_fixed NUMERIC NOT NULL,
  wage_variable NUMERIC DEFAULT '0.00',
  wage_fix_code TEXT NOT NULL,
  wage_ot_perhr_price NUMERIC DEFAULT '0.00',
  labor_id INTEGER NOT NULL,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_on TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL,
  UNIQUE (wage_fix_code),
  FOREIGN KEY (labor_id) REFERENCES labors (labor_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS wage_settlement;

CREATE TABLE wage_settlement (
  running_wage_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  wage_id INTEGER NOT NULL,
  settled_amount NUMERIC DEFAULT '0.00',
  advance_amount NUMERIC DEFAULT '0.00',
  running_wage_transaction_date date NOT NULL,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_on TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL,
  FOREIGN KEY (wage_id) REFERENCES wage (wage_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS wagepicking;

CREATE TABLE wagepicking (
  wagepicking_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  wage_id INTEGER NOT NULL,
  yield_id INTEGER NOT NULL,
  picking_price NUMERIC NOT NULL,
  picking_fix_code TEXT NOT NULL,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_on TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL,
  UNIQUE (picking_fix_code),
  FOREIGN KEY (wage_id) REFERENCES wage (wage_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS wageyield;

CREATE TABLE wageyield (
  wageyield_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  wage_id INTEGER NOT NULL,
  yieldtype_id INTEGER NOT NULL,
  baseunit_id INTEGER NOT NULL,
  plant_id INTEGER DEFAULT NULL,
  wageyield_date date NOT NULL,
  quantity REAL NOT NULL,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_date TEXT DEFAULT CURRENT_TIMESTAMP,
  modified_by TEXT DEFAULT NULL,
  FOREIGN KEY (baseunit_id) REFERENCES baseunit (baseunit_id),
  FOREIGN KEY (plant_id) REFERENCES plantdetails (plant_id),
  FOREIGN KEY (wage_id) REFERENCES wage (wage_id),
  FOREIGN KEY (yieldtype_id) REFERENCES yieldtype (yieldtype_id)
);

DROP TABLE IF EXISTS yield_settlement;

CREATE TABLE yield_settlement (
  yield_settlement_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  yieldrate_id INTEGER DEFAULT NULL,
  yield_quantity NUMERIC NOT NULL,
  yield_settlement_date TEXT DEFAULT NULL,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_date TEXT DEFAULT CURRENT_TIMESTAMP,
  modified_by TEXT DEFAULT NULL,
  FOREIGN KEY (yieldrate_id) REFERENCES yieldrate (yieldrate_id) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS yieldrate;

CREATE TABLE yieldrate (
  yieldrate_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL,
  yieldtype_id INTEGER NOT NULL,
  yieldrate_code TEXT NOT NULL,
  yieldrate_running_rate NUMERIC NOT NULL,
  baseunit_id INTEGER NOT NULL,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_date TEXT DEFAULT CURRENT_TIMESTAMP,
  modified_by TEXT DEFAULT NULL,
  FOREIGN KEY (baseunit_id) REFERENCES baseunit (baseunit_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (plant_id) REFERENCES plantdetails (plant_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (yieldtype_id) REFERENCES yieldtype (yieldtype_id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS yieldtype;

CREATE TABLE yieldtype (
  yieldtype_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  yieldtype_name TEXT NOT NULL,
  plant_id INTEGER NOT NULL,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_date TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL,
  UNIQUE (yieldtype_name),
  FOREIGN KEY (plant_id) REFERENCES plantdetails (plant_id) ON DELETE CASCADE ON UPDATE CASCADE
);

PRAGMA foreign_keys = ON;

-- Added in enhancement: plant inventory by property/block/sub-block.
CREATE TABLE IF NOT EXISTS plant_inventory (
  plant_inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  block_id INTEGER NOT NULL,
  sub_block_name TEXT,
  plant_id INTEGER NOT NULL,
  plant_count INTEGER NOT NULL DEFAULT 0 CHECK (plant_count >= 0),
  planting_date TEXT,
  notes TEXT,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY (property_id) REFERENCES property(property_id),
  FOREIGN KEY (block_id) REFERENCES blocks(block_id),
  FOREIGN KEY (plant_id) REFERENCES plantdetails(plant_id)
);

CREATE INDEX IF NOT EXISTS idx_plant_inventory_property ON plant_inventory(property_id);
CREATE INDEX IF NOT EXISTS idx_plant_inventory_block ON plant_inventory(block_id);
CREATE INDEX IF NOT EXISTS idx_plant_inventory_plant ON plant_inventory(plant_id);
