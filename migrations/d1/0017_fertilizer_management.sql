CREATE TABLE IF NOT EXISTS fertilizer_master (
  fertilizer_master_id INTEGER PRIMARY KEY AUTOINCREMENT,
  fertilizer_name TEXT NOT NULL,
  grade TEXT,
  category TEXT,
  purchase_unit_id INTEGER,
  base_unit_id INTEGER NOT NULL,
  package_size REAL NOT NULL DEFAULT 1 CHECK (package_size > 0),
  conversion_to_base REAL NOT NULL DEFAULT 1 CHECK (conversion_to_base > 0),
  minimum_stock_base REAL NOT NULL DEFAULT 0 CHECK (minimum_stock_base >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  notes TEXT,
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY (purchase_unit_id) REFERENCES baseunit(baseunit_id),
  FOREIGN KEY (base_unit_id) REFERENCES baseunit(baseunit_id),
  UNIQUE (fertilizer_name, grade)
);

CREATE TABLE IF NOT EXISTS fertilizer_purchase (
  fertilizer_purchase_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  fertilizer_master_id INTEGER NOT NULL,
  supplier_id INTEGER,
  purchase_date TEXT NOT NULL,
  invoice_number TEXT,
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit_id INTEGER NOT NULL,
  quantity_base REAL NOT NULL CHECK (quantity_base > 0),
  rate_per_unit REAL NOT NULL DEFAULT 0 CHECK (rate_per_unit >= 0),
  total_amount REAL NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_mode TEXT,
  expense_id INTEGER,
  notes TEXT,
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY (property_id) REFERENCES property(property_id),
  FOREIGN KEY (fertilizer_master_id) REFERENCES fertilizer_master(fertilizer_master_id),
  FOREIGN KEY (supplier_id) REFERENCES vendor(vendor_id),
  FOREIGN KEY (unit_id) REFERENCES baseunit(baseunit_id),
  FOREIGN KEY (expense_id) REFERENCES running_expenses(expense_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS fertilizer_application (
  fertilizer_application_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  fertilizer_master_id INTEGER NOT NULL,
  block_id INTEGER,
  sub_block_name TEXT,
  variety_master_id INTEGER,
  application_date TEXT NOT NULL,
  application_method TEXT,
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit_id INTEGER NOT NULL,
  quantity_base REAL NOT NULL CHECK (quantity_base > 0),
  work_assignment_id INTEGER,
  notes TEXT,
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY (property_id) REFERENCES property(property_id),
  FOREIGN KEY (fertilizer_master_id) REFERENCES fertilizer_master(fertilizer_master_id),
  FOREIGN KEY (block_id) REFERENCES blocks(block_id) ON DELETE SET NULL,
  FOREIGN KEY (variety_master_id) REFERENCES variety_master(variety_master_id) ON DELETE SET NULL,
  FOREIGN KEY (unit_id) REFERENCES baseunit(baseunit_id),
  FOREIGN KEY (work_assignment_id) REFERENCES work_assignment(work_assignment_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS fertilizer_adjustment (
  fertilizer_adjustment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  fertilizer_master_id INTEGER NOT NULL,
  adjustment_date TEXT NOT NULL,
  adjustment_type TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('IN','OUT')),
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit_id INTEGER NOT NULL,
  quantity_base REAL NOT NULL CHECK (quantity_base > 0),
  reason TEXT NOT NULL,
  notes TEXT,
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  modified_on TEXT,
  modified_by TEXT,
  FOREIGN KEY (property_id) REFERENCES property(property_id),
  FOREIGN KEY (fertilizer_master_id) REFERENCES fertilizer_master(fertilizer_master_id),
  FOREIGN KEY (unit_id) REFERENCES baseunit(baseunit_id)
);

CREATE TABLE IF NOT EXISTS fertilizer_stock_movement (
  fertilizer_stock_movement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  fertilizer_master_id INTEGER NOT NULL,
  movement_date TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('IN','OUT')),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('PURCHASE','APPLICATION','OPENING','RETURN','DAMAGE','CORRECTION')),
  quantity_base REAL NOT NULL CHECK (quantity_base > 0),
  reference_type TEXT NOT NULL,
  reference_id INTEGER NOT NULL,
  notes TEXT,
  created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  FOREIGN KEY (property_id) REFERENCES property(property_id),
  FOREIGN KEY (fertilizer_master_id) REFERENCES fertilizer_master(fertilizer_master_id),
  UNIQUE (reference_type, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_fertilizer_purchase_property_date ON fertilizer_purchase(property_id, purchase_date);
CREATE INDEX IF NOT EXISTS idx_fertilizer_application_property_date ON fertilizer_application(property_id, application_date);
CREATE INDEX IF NOT EXISTS idx_fertilizer_movement_property_item ON fertilizer_stock_movement(property_id, fertilizer_master_id, movement_date);

INSERT INTO expensetype (expense_code, expense_name, current_rate, created_by)
SELECT 'FERT-PURCHASE', 'Fertilizer Purchase', 0, 'Migration'
WHERE NOT EXISTS (SELECT 1 FROM expensetype WHERE expense_code = 'FERT-PURCHASE');
