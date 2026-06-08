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
INSERT INTO attendance VALUES (1,1,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 15:39:55',NULL,0.00),(2,11,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 15:39:55',NULL,0.00),(3,1,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 16:43:38',NULL,1.00),(4,1,1,1,'2025-09-02 00:00:00','Admin',NULL,'2025-09-30 16:43:38',NULL,1.00),(5,11,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 16:43:38',NULL,1.00),(6,11,1,1,'2025-09-02 00:00:00','Admin',NULL,'2025-09-30 16:43:38',NULL,1.00),(7,12,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 16:43:38',NULL,1.00),(8,12,1,1,'2025-09-02 00:00:00','Admin',NULL,'2025-09-30 16:43:38',NULL,0.50),(9,1,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,1.00),(10,1,1,1,'2025-09-02 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,1.00),(11,1,1,1,'2025-09-03 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,1.00),(12,11,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,1.00),(13,11,1,1,'2025-09-02 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,1.00),(14,11,1,1,'2025-09-03 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,0.50),(15,12,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,1.00),(16,12,1,1,'2025-09-02 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,0.50),(17,12,1,1,'2025-09-03 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,0.25);
DROP TABLE IF EXISTS baseunit;
CREATE TABLE baseunit (
  baseunit_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  baseunit_name TEXT NOT NULL,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_date TEXT DEFAULT CURRENT_TIMESTAMP,
  modified_by TEXT DEFAULT NULL
);
INSERT INTO baseunit VALUES (1,'kg','2025-10-11 08:34:07','sys','2025-10-11 08:34:07',NULL),(2,'bushal','2025-10-11 08:34:07','sys','2025-10-11 08:34:07',NULL),(3,'mm','2025-10-11 08:34:07','sys','2025-10-11 08:34:07',NULL);
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
INSERT INTO blocks VALUES (1,'A',23,1,NULL),(3,'B',33,1,NULL),(4,'Q',11,1,NULL),(5,'SUB BLOCK A',22,1,1);
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
INSERT INTO cropdetails VALUES (1,20000,11000,1,NULL,NULL,NULL,NULL,NULL),(2,22,1111,1,'2024-09-12 14:44:43',NULL,NULL,NULL,NULL),(3,200,20000,2,NULL,NULL,NULL,NULL,NULL),(4,200,20000,2,NULL,NULL,NULL,NULL,NULL),(5,12,111,1,NULL,NULL,NULL,NULL,NULL),(6,195,20000,1,'2025-09-29 23:54:46','sys',NULL,NULL,''),(7,195,20000,2,'2025-09-29 23:55:07','sys',NULL,NULL,''),(8,21,222,1,'2025-09-29 23:55:33','sys',NULL,NULL,'');
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
INSERT INTO fertilizers VALUES (1,'NPK 20-10-70','2024-08-30',1,NULL,NULL,NULL,NULL,NULL);
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
INSERT INTO labors VALUES (1,1,'Sundara',30,'420420- 420420','Jagara International Bank','Health and fix','https://en.wikipedia.org/wiki/Sunder_%28actor%29#/media/File:Sunder_Actor.jpg','Jagara','Owner address',NULL,NULL,NULL,NULL),(2,1,'Best Labour',23,'3232323','23232','adsadasdas','','sadsasad','11222','2024-09-12 14:43:23',NULL,NULL,NULL),(3,1,'Test Lab 2',22,'122212','221121','asassad','','sdsds','sdsd','2024-09-13 15:26:41',NULL,NULL,NULL),(4,5,'Test Lab 21',22,'122212','221121','asassad','','sdsds','sdsd','2024-09-13 15:27:02',NULL,NULL,NULL),(5,5,'Test Lab 3',33,'3232323','55555','ddsfds','sa','fsasfa','afasfasf','2024-09-13 15:37:49',NULL,NULL,NULL),(6,1,'Test Lab 3',33,'3232323','55555','ddsfds','sa','fsasfa','afasfasf','2024-09-13 15:38:13',NULL,NULL,NULL),(7,1,'Test Lab 3',33,'3232323','55555','ddsfds','sa','fsasfa','afasfasf','2024-09-13 15:42:37',NULL,NULL,NULL),(8,1,'Test Lab 32',33,'3232323','55555','ddsfds','sa','fsasfa','afasfasf','2024-09-13 15:53:58',NULL,NULL,NULL),(9,1,'Test Lab 55',33,'3232323','55555','ddsfds','sa','fsasfa','afasfasf','2024-09-13 15:55:21',NULL,NULL,NULL),(10,1,'Test Lab 551',33,'3232323','55555','ddsfds','sa','fsasfa','afasfasf','2024-09-13 15:55:34',NULL,NULL,NULL),(11,1,'Test Lab 55322',33,'3232323','55555','ddsfds','sa','fsasfa','afasfasf','2024-09-13 15:58:01',NULL,NULL,NULL),(12,5,'TestNewLab1',26,'8888778999','122344','asadas','D:\\JavaTerrain','add 123','333','2025-09-29 23:26:05','sys',NULL,NULL);
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
INSERT INTO plantdetails VALUES (1,'arabica','This is good varity1111',3,NULL,NULL,NULL,'2024-09-11 15:47:36',NULL),(2,'arabica','sdsdsd',1,NULL,'2024-09-12 14:44:28',NULL,NULL,NULL),(3,'robusta','Some varity',1,NULL,'2025-09-29 23:46:25','sys',NULL,NULL);
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
INSERT INTO property VALUES (1,'Manjushree',12,'1122','777','999',1,NULL,NULL,'2024-09-05 11:38:07',NULL),(2,'Belavadi',23,'add2','add3','445555',1,NULL,NULL,NULL,NULL),(3,'Testprop1',1,'qw33','asda','33223',1,'2025-09-30 00:26:26','sys',NULL,NULL);
DROP TABLE IF EXISTS propertylabor;
CREATE TABLE propertylabor (
  property_id INTEGER DEFAULT NULL,
  labor_id INTEGER DEFAULT NULL,
  FOREIGN KEY (property_id) REFERENCES property (property_id),
  FOREIGN KEY (labor_id) REFERENCES labors (labor_id)
);
INSERT INTO propertylabor VALUES (1,1),(1,11),(1,12);
DROP TABLE IF EXISTS propertyuser;
CREATE TABLE propertyuser (
  property_id INTEGER DEFAULT NULL,
  user_id INTEGER DEFAULT NULL,
  FOREIGN KEY (property_id) REFERENCES property (property_id),
  FOREIGN KEY (user_id) REFERENCES users (user_id)
);
INSERT INTO propertyuser VALUES (2,1),(1,1),(1,5),(3,1);
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
INSERT INTO raindetails VALUES (1,'2024-08-29 15:23:00',333,3,NULL,NULL,'2024-09-11 15:23:05',NULL),(3,'2024-09-14 14:45:00',222,1,'2024-09-12 14:46:30',NULL,NULL,NULL),(4,'2024-09-07 16:25:00',5555,1,'2024-09-13 16:25:43',NULL,NULL,NULL),(5,'2025-09-24 03:08:00',22,1,'2025-09-30 00:05:42','sys',NULL,NULL);
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
INSERT INTO reports VALUES (1,222222,888889000,25,NULL,NULL,NULL,NULL,NULL),(2,200000,1000000,800000,NULL,NULL,NULL,NULL,NULL);
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
INSERT INTO users VALUES (1,'Asnika Sridhar','$2a$12$nQl5x2G/u3Tf32SPz3B9I.Vf/21Z3GwBOzMghErOKZOwO0.dGZNPC','owner',1,'asnikasridhar1@gmail.com',NULL,NULL,NULL,NULL),(3,'Pavan','pavan','owner',1,'pavan@bhushan.com',NULL,NULL,NULL,NULL),(4,'Ishaan','chiinipaapu','owner',1,'ishaan@baabi.com',NULL,NULL,NULL,NULL),(5,'pavan1','$2b$10$nxfr9MCtspOnq3dAoCyfS./IP5A6M0CuDb3kDLvt9R6Onpl.HFJMu','owner',1,'alexmahone@gmail.com','2024-09-11 17:17:25',NULL,NULL,NULL),(6,'UserTest123','$2b$10$eENSBPNgbOEe43gNwkhLYuVIOLplmKox3ZqrDXhmgqNxYKzDHFpI.','owner',1,'user@email.com','2025-09-29 23:28:25','sys',NULL,NULL);
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
INSERT INTO wage VALUES (1,100.00,100.00,'WG_LABNAME_25',50.00,1,'2025-10-13 04:52:18','sys',NULL,NULL),(2,150.00,100.00,'WG_LABNAME2_25',50.00,2,'2025-10-13 04:53:31','sys',NULL,NULL);
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
INSERT INTO yield_settlement VALUES (1,1,100.00,'2025-10-11 00:00:00','2025-10-11 00:00:00','sys','2025-10-11 17:04:04',NULL);
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
INSERT INTO yieldrate VALUES (1,1,1,'ARA_CO_TODAYDATE',2300.00,1,'2025-10-11 00:00:00','sys','2025-10-11 08:40:45',NULL);
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
INSERT INTO yieldtype VALUES (1,'fruit',1,'2025-10-11 00:00:00','sys',NULL,NULL),(2,'parchment',1,'2025-10-11 00:00:00','sys',NULL,NULL);

PRAGMA foreign_keys = ON;
