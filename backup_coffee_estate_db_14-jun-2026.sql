PRAGMA defer_foreign_keys=TRUE;
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
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(1,1,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 15:39:55',NULL,0);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(2,11,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 15:39:55',NULL,0);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(3,1,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 16:43:38',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(4,1,1,1,'2025-09-02 00:00:00','Admin',NULL,'2025-09-30 16:43:38',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(5,11,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 16:43:38',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(6,11,1,1,'2025-09-02 00:00:00','Admin',NULL,'2025-09-30 16:43:38',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(7,12,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 16:43:38',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(8,12,1,1,'2025-09-02 00:00:00','Admin',NULL,'2025-09-30 16:43:38',NULL,0.5);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(9,1,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(10,1,1,1,'2025-09-02 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(11,1,1,1,'2025-09-03 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(12,11,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(13,11,1,1,'2025-09-02 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(14,11,1,1,'2025-09-03 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,0.5);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(15,12,1,1,'2025-09-01 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(16,12,1,1,'2025-09-02 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,0.5);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(17,12,1,1,'2025-09-03 00:00:00','Admin',NULL,'2025-09-30 16:47:05',NULL,0.25);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(18,2,1,1,'2026-06-09','Asnika Sridhar',NULL,'2026-06-09 16:34:19',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(19,2,1,1,'2026-06-09','Asnika Sridhar',NULL,'2026-06-09 16:34:24',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(20,13,1,1,'2026-06-11','Asnika Sridhar',NULL,'2026-06-11 09:51:53',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(21,13,1,1,'2026-06-11','Asnika Sridhar',NULL,'2026-06-11 09:52:03',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(22,13,1,1,'2026-06-11','Asnika Sridhar',NULL,'2026-06-11 09:52:26',NULL,1);
INSERT INTO "attendance" ("attendance_id","labor_id","property_id","user_id","entry_date","created_by","modified_by","created_on","modified_on","attendance_value") VALUES(23,13,1,1,'2026-06-11','Asnika Sridhar',NULL,'2026-06-11 09:52:29',NULL,1);
CREATE TABLE baseunit (
  baseunit_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  baseunit_name TEXT NOT NULL,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_date TEXT DEFAULT CURRENT_TIMESTAMP,
  modified_by TEXT DEFAULT NULL
);
INSERT INTO "baseunit" ("baseunit_id","baseunit_name","created_date","created_by","modified_date","modified_by") VALUES(1,'kg','2025-10-11 08:34:07','sys','2025-10-11 08:34:07',NULL);
INSERT INTO "baseunit" ("baseunit_id","baseunit_name","created_date","created_by","modified_date","modified_by") VALUES(2,'bushal','2025-10-11 08:34:07','sys','2025-10-11 08:34:07',NULL);
INSERT INTO "baseunit" ("baseunit_id","baseunit_name","created_date","created_by","modified_date","modified_by") VALUES(3,'mm','2025-10-11 08:34:07','sys','2025-10-11 08:34:07',NULL);
CREATE TABLE blocks (
  block_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  block_name TEXT NOT NULL,
  block_area REAL DEFAULT NULL,
  property_id INTEGER DEFAULT NULL,
  parent_block_id INTEGER DEFAULT NULL,
  FOREIGN KEY (property_id) REFERENCES property (property_id),
  FOREIGN KEY (parent_block_id) REFERENCES blocks (block_id) ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "blocks" ("block_id","block_name","block_area","property_id","parent_block_id") VALUES(1,'A',23,1,NULL);
INSERT INTO "blocks" ("block_id","block_name","block_area","property_id","parent_block_id") VALUES(3,'B',33,1,NULL);
INSERT INTO "blocks" ("block_id","block_name","block_area","property_id","parent_block_id") VALUES(4,'Q',11,1,NULL);
INSERT INTO "blocks" ("block_id","block_name","block_area","property_id","parent_block_id") VALUES(5,'SUB BLOCK A',22,1,1);
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
INSERT INTO "cropdetails" ("crop_id","yield_obtained","selling_price","property_id","created_on","created_by","modified_on","modified_by","other_detail") VALUES(1,20000,11000,1,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "cropdetails" ("crop_id","yield_obtained","selling_price","property_id","created_on","created_by","modified_on","modified_by","other_detail") VALUES(2,22,1111,1,'2024-09-12 14:44:43',NULL,NULL,NULL,NULL);
INSERT INTO "cropdetails" ("crop_id","yield_obtained","selling_price","property_id","created_on","created_by","modified_on","modified_by","other_detail") VALUES(3,200,20000,2,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "cropdetails" ("crop_id","yield_obtained","selling_price","property_id","created_on","created_by","modified_on","modified_by","other_detail") VALUES(4,200,20000,2,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "cropdetails" ("crop_id","yield_obtained","selling_price","property_id","created_on","created_by","modified_on","modified_by","other_detail") VALUES(5,12,111,1,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "cropdetails" ("crop_id","yield_obtained","selling_price","property_id","created_on","created_by","modified_on","modified_by","other_detail") VALUES(6,195,20000,1,'2025-09-29 23:54:46','sys',NULL,NULL,'');
INSERT INTO "cropdetails" ("crop_id","yield_obtained","selling_price","property_id","created_on","created_by","modified_on","modified_by","other_detail") VALUES(7,195,20000,2,'2025-09-29 23:55:07','sys',NULL,NULL,'');
INSERT INTO "cropdetails" ("crop_id","yield_obtained","selling_price","property_id","created_on","created_by","modified_on","modified_by","other_detail") VALUES(8,21,222,1,'2025-09-29 23:55:33','sys',NULL,NULL,'');
INSERT INTO "cropdetails" ("crop_id","yield_obtained","selling_price","property_id","created_on","created_by","modified_on","modified_by","other_detail") VALUES(9,50000,20000,1,NULL,'Asnika Sridhar',NULL,NULL,'');
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
INSERT INTO "currentasset" ("currentasset_id","asset_name","asset_price","procured_year","isactive","property_id","asset_procured_source","created_date","created_by","modified_date","modified_by") VALUES(1,'Diesel',10000,2026,1,1,'Cash','2026-06-11 09:27:17','Asnika Sridhar','2026-06-11 09:27:17',NULL);
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
INSERT INTO "expensetype" ("expensetype_id","expense_code","expense_name","current_rate","baseunit_id","created_date","created_by","modified_date","modified_by") VALUES(2,'1','Deisel',100,2,'2026-06-11 09:35:46','Asnika Sridhar','2026-06-11 09:35:46',NULL);
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
INSERT INTO "fertilizers" ("fertilizer_id","fertilizer_name","date_of_application","property_id","created_on","created_by","modified_on","modified_by","other_details") VALUES(1,'NPK 20-10-70','2024-08-30',1,NULL,NULL,NULL,NULL,NULL);
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
INSERT INTO "labors" ("labor_id","user_id","name","age","adhar_card","bank_details","health_history","photo","address","emergency_details","created_on","created_by","modified_on","modified_by") VALUES(1,1,'Sundara',30,'420420- 420420','Jagara International Bank','Health and fix','https://en.wikipedia.org/wiki/Sunder_%28actor%29#/media/File:Sunder_Actor.jpg','Jagara','Owner address',NULL,NULL,NULL,NULL);
INSERT INTO "labors" ("labor_id","user_id","name","age","adhar_card","bank_details","health_history","photo","address","emergency_details","created_on","created_by","modified_on","modified_by") VALUES(2,1,'Best Labour',23,'3232323','23232','adsadasdas','','sadsasad','11222','2024-09-12 14:43:23',NULL,NULL,NULL);
INSERT INTO "labors" ("labor_id","user_id","name","age","adhar_card","bank_details","health_history","photo","address","emergency_details","created_on","created_by","modified_on","modified_by") VALUES(3,1,'Test Lab 2',22,'122212','221121','asassad','','sdsds','sdsd','2024-09-13 15:26:41',NULL,NULL,NULL);
INSERT INTO "labors" ("labor_id","user_id","name","age","adhar_card","bank_details","health_history","photo","address","emergency_details","created_on","created_by","modified_on","modified_by") VALUES(4,5,'Test Lab 21',22,'122212','221121','asassad','','sdsds','sdsd','2024-09-13 15:27:02',NULL,NULL,NULL);
INSERT INTO "labors" ("labor_id","user_id","name","age","adhar_card","bank_details","health_history","photo","address","emergency_details","created_on","created_by","modified_on","modified_by") VALUES(5,5,'Test Lab 3',33,'3232323','55555','ddsfds','sa','fsasfa','afasfasf','2024-09-13 15:37:49',NULL,NULL,NULL);
INSERT INTO "labors" ("labor_id","user_id","name","age","adhar_card","bank_details","health_history","photo","address","emergency_details","created_on","created_by","modified_on","modified_by") VALUES(6,1,'Test Lab 3',33,'3232323','55555','ddsfds','sa','fsasfa','afasfasf','2024-09-13 15:38:13',NULL,NULL,NULL);
INSERT INTO "labors" ("labor_id","user_id","name","age","adhar_card","bank_details","health_history","photo","address","emergency_details","created_on","created_by","modified_on","modified_by") VALUES(7,1,'Test Lab 3',33,'3232323','55555','ddsfds','sa','fsasfa','afasfasf','2024-09-13 15:42:37',NULL,NULL,NULL);
INSERT INTO "labors" ("labor_id","user_id","name","age","adhar_card","bank_details","health_history","photo","address","emergency_details","created_on","created_by","modified_on","modified_by") VALUES(8,1,'Test Lab 32',33,'3232323','55555','ddsfds','sa','fsasfa','afasfasf','2024-09-13 15:53:58',NULL,NULL,NULL);
INSERT INTO "labors" ("labor_id","user_id","name","age","adhar_card","bank_details","health_history","photo","address","emergency_details","created_on","created_by","modified_on","modified_by") VALUES(9,1,'Test Lab 55',33,'3232323','55555','ddsfds','sa','fsasfa','afasfasf','2024-09-13 15:55:21',NULL,NULL,NULL);
INSERT INTO "labors" ("labor_id","user_id","name","age","adhar_card","bank_details","health_history","photo","address","emergency_details","created_on","created_by","modified_on","modified_by") VALUES(10,1,'Test Lab 551',33,'3232323','55555','ddsfds','sa','fsasfa','afasfasf','2024-09-13 15:55:34',NULL,NULL,NULL);
INSERT INTO "labors" ("labor_id","user_id","name","age","adhar_card","bank_details","health_history","photo","address","emergency_details","created_on","created_by","modified_on","modified_by") VALUES(11,1,'Test Lab 55322',33,'3232323','55555','ddsfds','sa','fsasfa','afasfasf','2024-09-13 15:58:01',NULL,NULL,NULL);
INSERT INTO "labors" ("labor_id","user_id","name","age","adhar_card","bank_details","health_history","photo","address","emergency_details","created_on","created_by","modified_on","modified_by") VALUES(12,5,'TestNewLab1',26,'8888778999','122344','asadas','D:\\JavaTerrain','add 123','333','2025-09-29 23:26:05','sys',NULL,NULL);
INSERT INTO "labors" ("labor_id","user_id","name","age","adhar_card","bank_details","health_history","photo","address","emergency_details","created_on","created_by","modified_on","modified_by") VALUES(13,1,'Vinutha',35,'1111','11111',NULL,NULL,'1234','2222',NULL,'Asnika Sridhar',NULL,NULL);
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
INSERT INTO "plantdetails" ("plant_id","plant_type","details","block_id","plantdetailscol","created_on","created_by","modified_on","modified_by") VALUES(1,'arabica','This is good varity1111',3,NULL,NULL,NULL,'2024-09-11 15:47:36',NULL);
INSERT INTO "plantdetails" ("plant_id","plant_type","details","block_id","plantdetailscol","created_on","created_by","modified_on","modified_by") VALUES(2,'arabica','sdsdsd',1,NULL,'2024-09-12 14:44:28',NULL,NULL,NULL);
INSERT INTO "plantdetails" ("plant_id","plant_type","details","block_id","plantdetailscol","created_on","created_by","modified_on","modified_by") VALUES(3,'robusta','Some varity',1,NULL,'2025-09-29 23:46:25','sys',NULL,NULL);
INSERT INTO "plantdetails" ("plant_id","plant_type","details","block_id","plantdetailscol","created_on","created_by","modified_on","modified_by") VALUES(4,'Arabica','New a',1,NULL,NULL,'Asnika Sridhar',NULL,NULL);
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
INSERT INTO "property" ("property_id","property_name","total_acre","address_1","address_2","pincode","user_id","created_on","created_by","modified_on","modified_by") VALUES(1,'Manjushree',12,'1122','777','999',1,NULL,NULL,'2024-09-05 11:38:07',NULL);
INSERT INTO "property" ("property_id","property_name","total_acre","address_1","address_2","pincode","user_id","created_on","created_by","modified_on","modified_by") VALUES(2,'Belavadi',23,'add2','add3','445555',1,NULL,NULL,NULL,NULL);
INSERT INTO "property" ("property_id","property_name","total_acre","address_1","address_2","pincode","user_id","created_on","created_by","modified_on","modified_by") VALUES(3,'Testprop1',1,'qw33','asda','33223',1,'2025-09-30 00:26:26','sys',NULL,NULL);
INSERT INTO "property" ("property_id","property_name","total_acre","address_1","address_2","pincode","user_id","created_on","created_by","modified_on","modified_by") VALUES(4,'Manjushree',45,'111','','577102',1,NULL,'Asnika Sridhar',NULL,NULL);
CREATE TABLE propertylabor (
  property_id INTEGER DEFAULT NULL,
  labor_id INTEGER DEFAULT NULL,
  FOREIGN KEY (property_id) REFERENCES property (property_id),
  FOREIGN KEY (labor_id) REFERENCES labors (labor_id)
);
INSERT INTO "propertylabor" ("property_id","labor_id") VALUES(1,1);
INSERT INTO "propertylabor" ("property_id","labor_id") VALUES(1,11);
INSERT INTO "propertylabor" ("property_id","labor_id") VALUES(1,12);
CREATE TABLE propertyuser (
  property_id INTEGER DEFAULT NULL,
  user_id INTEGER DEFAULT NULL,
  FOREIGN KEY (property_id) REFERENCES property (property_id),
  FOREIGN KEY (user_id) REFERENCES users (user_id)
);
INSERT INTO "propertyuser" ("property_id","user_id") VALUES(2,1);
INSERT INTO "propertyuser" ("property_id","user_id") VALUES(1,1);
INSERT INTO "propertyuser" ("property_id","user_id") VALUES(1,5);
INSERT INTO "propertyuser" ("property_id","user_id") VALUES(3,1);
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
INSERT INTO "raindetails" ("rain_id","date_time","rain_amount","block_id","created_on","created_by","modified_on","modified_by") VALUES(1,'2024-08-29 15:23:00',333,3,NULL,NULL,'2024-09-11 15:23:05',NULL);
INSERT INTO "raindetails" ("rain_id","date_time","rain_amount","block_id","created_on","created_by","modified_on","modified_by") VALUES(3,'2024-09-14 14:45:00',222,1,'2024-09-12 14:46:30',NULL,NULL,NULL);
INSERT INTO "raindetails" ("rain_id","date_time","rain_amount","block_id","created_on","created_by","modified_on","modified_by") VALUES(4,'2024-09-07 16:25:00',5555,1,'2024-09-13 16:25:43',NULL,NULL,NULL);
INSERT INTO "raindetails" ("rain_id","date_time","rain_amount","block_id","created_on","created_by","modified_on","modified_by") VALUES(5,'2025-09-24 03:08:00',22,1,'2025-09-30 00:05:42','sys',NULL,NULL);
INSERT INTO "raindetails" ("rain_id","date_time","rain_amount","block_id","created_on","created_by","modified_on","modified_by") VALUES(6,'2026-06-09',10,1,'2026-06-09 16:34:05','Asnika Sridhar',NULL,NULL);
INSERT INTO "raindetails" ("rain_id","date_time","rain_amount","block_id","created_on","created_by","modified_on","modified_by") VALUES(7,'2026-06-09',10,3,'2026-06-09 16:34:49','Asnika Sridhar',NULL,NULL);
INSERT INTO "raindetails" ("rain_id","date_time","rain_amount","block_id","created_on","created_by","modified_on","modified_by") VALUES(8,'2026-06-09',100,1,'2026-06-09 16:35:00','Asnika Sridhar',NULL,NULL);
INSERT INTO "raindetails" ("rain_id","date_time","rain_amount","block_id","created_on","created_by","modified_on","modified_by") VALUES(9,'2026-06-09',1.05,1,'2026-06-09 16:35:41','Asnika Sridhar',NULL,NULL);
INSERT INTO "raindetails" ("rain_id","date_time","rain_amount","block_id","created_on","created_by","modified_on","modified_by") VALUES(10,'2026-06-09',0,1,'2026-06-09 16:35:49','Asnika Sridhar',NULL,NULL);
INSERT INTO "raindetails" ("rain_id","date_time","rain_amount","block_id","created_on","created_by","modified_on","modified_by") VALUES(11,'2026-06-09',0,3,'2026-06-09 16:40:41','Asnika Sridhar',NULL,NULL);
INSERT INTO "raindetails" ("rain_id","date_time","rain_amount","block_id","created_on","created_by","modified_on","modified_by") VALUES(12,'2026-06-09',99,4,'2026-06-09 16:40:49','Asnika Sridhar',NULL,NULL);
INSERT INTO "raindetails" ("rain_id","date_time","rain_amount","block_id","created_on","created_by","modified_on","modified_by") VALUES(13,'2026-06-11',66,1,'2026-06-11 09:51:38','Asnika Sridhar',NULL,NULL);
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
INSERT INTO "reports" ("report_id","total_expenditure","total_revenue","profit_loss","property_id","created_on","created_by","modified_on","modified_by") VALUES(1,222222,888889000,25,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "reports" ("report_id","total_expenditure","total_revenue","profit_loss","property_id","created_on","created_by","modified_on","modified_by") VALUES(2,200000,1000000,800000,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "reports" ("report_id","total_expenditure","total_revenue","profit_loss","property_id","created_on","created_by","modified_on","modified_by") VALUES(4,45000,1000000,'',1,NULL,'Asnika Sridhar',NULL,NULL);
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
INSERT INTO "users" ("user_id","username","password","role","is_active","email","created_on","created_by","modified_on","modified_by") VALUES(1,'Asnika Sridhar','owner123','owner',1,'asnikasridhar1@gmail.com',NULL,NULL,NULL,NULL);
INSERT INTO "users" ("user_id","username","password","role","is_active","email","created_on","created_by","modified_on","modified_by") VALUES(3,'Pavan','pavan','owner',1,'pavan@bhushan.com',NULL,NULL,NULL,NULL);
INSERT INTO "users" ("user_id","username","password","role","is_active","email","created_on","created_by","modified_on","modified_by") VALUES(4,'Ishaan','chiinipaapu','owner',1,'ishaan@baabi.com',NULL,NULL,NULL,NULL);
INSERT INTO "users" ("user_id","username","password","role","is_active","email","created_on","created_by","modified_on","modified_by") VALUES(5,'pavan1','$2b$10$nxfr9MCtspOnq3dAoCyfS./IP5A6M0CuDb3kDLvt9R6Onpl.HFJMu','owner',1,'alexmahone@gmail.com','2024-09-11 17:17:25',NULL,NULL,NULL);
INSERT INTO "users" ("user_id","username","password","role","is_active","email","created_on","created_by","modified_on","modified_by") VALUES(6,'UserTest123','$2b$10$eENSBPNgbOEe43gNwkhLYuVIOLplmKox3ZqrDXhmgqNxYKzDHFpI.','owner',1,'user@email.com','2025-09-29 23:28:25','sys',NULL,NULL);
CREATE TABLE vendor (
  vendor_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  vendorname TEXT NOT NULL,
  description text,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT NULL,
  modified_on TEXT DEFAULT NULL,
  modified_by TEXT DEFAULT NULL
);
INSERT INTO "vendor" ("vendor_id","vendorname","description","created_on","created_by","modified_on","modified_by") VALUES(1,'In-house ','In-house empl','2026-06-11 09:45:03','Asnika Sridhar',NULL,NULL);
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
INSERT INTO "wage" ("wage_id","wage_fixed","wage_variable","wage_fix_code","wage_ot_perhr_price","labor_id","created_on","created_by","modified_on","modified_by") VALUES(1,100,100,'WG_LABNAME_25',50,1,'2025-10-13 04:52:18','sys',NULL,NULL);
INSERT INTO "wage" ("wage_id","wage_fixed","wage_variable","wage_fix_code","wage_ot_perhr_price","labor_id","created_on","created_by","modified_on","modified_by") VALUES(2,150,100,'WG_LABNAME2_25',50,2,'2025-10-13 04:53:31','sys',NULL,NULL);
INSERT INTO "wage" ("wage_id","wage_fixed","wage_variable","wage_fix_code","wage_ot_perhr_price","labor_id","created_on","created_by","modified_on","modified_by") VALUES(3,120,200,'261',20,1,'2026-06-11 09:41:11','Asnika Sridhar',NULL,NULL);
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
INSERT INTO "yield_settlement" ("yield_settlement_id","yieldrate_id","yield_quantity","yield_settlement_date","created_date","created_by","modified_date","modified_by") VALUES(1,1,100,'2025-10-11 00:00:00','2025-10-11 00:00:00','sys','2025-10-11 17:04:04',NULL);
INSERT INTO "yield_settlement" ("yield_settlement_id","yieldrate_id","yield_quantity","yield_settlement_date","created_date","created_by","modified_date","modified_by") VALUES(2,1,50000,'2026-06-11','2026-06-11 09:51:17','Asnika Sridhar','2026-06-11 09:51:17',NULL);
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
INSERT INTO "yieldrate" ("yieldrate_id","plant_id","yieldtype_id","yieldrate_code","yieldrate_running_rate","baseunit_id","created_date","created_by","modified_date","modified_by") VALUES(1,1,1,'ARA_CO_TODAYDATE',2300,1,'2025-10-11 00:00:00','sys','2025-10-11 08:40:45',NULL);
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
INSERT INTO "yieldtype" ("yieldtype_id","yieldtype_name","plant_id","created_date","created_by","modified_date","modified_by") VALUES(1,'fruit',1,'2025-10-11 00:00:00','sys',NULL,NULL);
INSERT INTO "yieldtype" ("yieldtype_id","yieldtype_name","plant_id","created_date","created_by","modified_date","modified_by") VALUES(2,'parchment',1,'2025-10-11 00:00:00','sys',NULL,NULL);
CREATE TABLE plant_inventory (
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
INSERT INTO "plant_inventory" ("plant_inventory_id","property_id","block_id","sub_block_name","plant_id","plant_count","planting_date","notes","created_on","created_by","modified_on","modified_by") VALUES(1,1,1,'Main row A',2,1800,'2021-06-15','Sample inventory for Manjushree Block A','2026-06-09 12:50:11','seed',NULL,NULL);
INSERT INTO "plant_inventory" ("plant_inventory_id","property_id","block_id","sub_block_name","plant_id","plant_count","planting_date","notes","created_on","created_by","modified_on","modified_by") VALUES(2,1,3,'North patch',1,1200,'2020-07-10','Sample inventory for Manjushree Block B','2026-06-09 12:50:11','seed',NULL,NULL);
INSERT INTO "plant_inventory" ("plant_inventory_id","property_id","block_id","sub_block_name","plant_id","plant_count","planting_date","notes","created_on","created_by","modified_on","modified_by") VALUES(3,1,5,'Sub block nursery',3,650,'2023-08-20','Sample inventory for sub block','2026-06-09 12:50:11','seed',NULL,NULL);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('attendance',23);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('baseunit',3);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('blocks',5);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('cropdetails',9);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('fertilizers',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('labors',13);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('plantdetails',4);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('property',4);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('raindetails',13);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('reports',4);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('users',6);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('wage',3);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('yield_settlement',2);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('yieldrate',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('yieldtype',2);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('plant_inventory',3);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('currentasset',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('expensetype',2);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('vendor',1);
CREATE INDEX idx_plant_inventory_property ON plant_inventory(property_id);
CREATE INDEX idx_plant_inventory_block ON plant_inventory(block_id);
CREATE INDEX idx_plant_inventory_plant ON plant_inventory(plant_id);
