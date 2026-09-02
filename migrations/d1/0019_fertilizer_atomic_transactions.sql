ALTER TABLE fertilizer_purchase ADD COLUMN create_expense INTEGER NOT NULL DEFAULT 1 CHECK(create_expense IN (0,1));

CREATE VIEW IF NOT EXISTS fertilizer_stock_balance AS
SELECT m.property_id,m.fertilizer_master_id,
       ROUND(COALESCE(SUM(CASE WHEN m.direction='IN' THEN m.quantity_base ELSE -m.quantity_base END),0),4) quantity_base
FROM fertilizer_stock_movement m
GROUP BY m.property_id,m.fertilizer_master_id;

CREATE TRIGGER IF NOT EXISTS fertilizer_purchase_ai AFTER INSERT ON fertilizer_purchase BEGIN
  INSERT INTO fertilizer_stock_movement(property_id,fertilizer_master_id,movement_date,direction,movement_type,quantity_base,reference_type,reference_id,notes,created_by)
  VALUES(NEW.property_id,NEW.fertilizer_master_id,NEW.purchase_date,'IN','PURCHASE',NEW.quantity_base,'PURCHASE',NEW.fertilizer_purchase_id,NEW.notes,NEW.created_by);
  INSERT INTO running_expenses(expensetype_id,property_id,expense_code,expense_occurence_date,other_expense,created_by)
  SELECT expensetype_id,NEW.property_id,'Fertilizer purchase' || CASE WHEN NEW.invoice_number IS NOT NULL AND NEW.invoice_number<>'' THEN ' · '||NEW.invoice_number ELSE '' END,NEW.purchase_date,NEW.total_amount,NEW.created_by
  FROM expensetype WHERE expense_code='FERT-PURCHASE' AND NEW.create_expense=1;
  UPDATE fertilizer_purchase SET expense_id=last_insert_rowid() WHERE fertilizer_purchase_id=NEW.fertilizer_purchase_id AND NEW.create_expense=1;
END;

CREATE TRIGGER IF NOT EXISTS fertilizer_purchase_bu BEFORE UPDATE ON fertilizer_purchase
WHEN (SELECT COALESCE(quantity_base,0) FROM fertilizer_stock_balance WHERE property_id=OLD.property_id AND fertilizer_master_id=OLD.fertilizer_master_id)-OLD.quantity_base+NEW.quantity_base<0
BEGIN SELECT RAISE(ABORT,'Purchase cannot be reduced because stock has already been consumed'); END;

CREATE TRIGGER IF NOT EXISTS fertilizer_purchase_au AFTER UPDATE OF property_id,fertilizer_master_id,purchase_date,quantity_base,total_amount,invoice_number,notes,create_expense ON fertilizer_purchase BEGIN
  UPDATE fertilizer_stock_movement SET property_id=NEW.property_id,fertilizer_master_id=NEW.fertilizer_master_id,movement_date=NEW.purchase_date,quantity_base=NEW.quantity_base,notes=NEW.notes
  WHERE reference_type='PURCHASE' AND reference_id=NEW.fertilizer_purchase_id;
  UPDATE running_expenses SET property_id=NEW.property_id,expense_code='Fertilizer purchase' || CASE WHEN NEW.invoice_number IS NOT NULL AND NEW.invoice_number<>'' THEN ' · '||NEW.invoice_number ELSE '' END,expense_occurence_date=NEW.purchase_date,other_expense=NEW.total_amount,modified_date=CURRENT_TIMESTAMP,modified_by=NEW.modified_by
  WHERE expense_id=OLD.expense_id AND NEW.create_expense=1;
  DELETE FROM running_expenses WHERE expense_id=OLD.expense_id AND NEW.create_expense=0;
END;

CREATE TRIGGER IF NOT EXISTS fertilizer_purchase_ad AFTER DELETE ON fertilizer_purchase BEGIN
  DELETE FROM fertilizer_stock_movement WHERE reference_type='PURCHASE' AND reference_id=OLD.fertilizer_purchase_id;
  DELETE FROM running_expenses WHERE expense_id=OLD.expense_id;
END;

CREATE TRIGGER IF NOT EXISTS fertilizer_application_bi BEFORE INSERT ON fertilizer_application
WHEN NEW.quantity_base>(SELECT COALESCE(quantity_base,0) FROM fertilizer_stock_balance WHERE property_id=NEW.property_id AND fertilizer_master_id=NEW.fertilizer_master_id)
BEGIN SELECT RAISE(ABORT,'Insufficient fertilizer stock for this property'); END;
CREATE TRIGGER IF NOT EXISTS fertilizer_application_bu BEFORE UPDATE ON fertilizer_application
WHEN NEW.quantity_base>(SELECT COALESCE(quantity_base,0) FROM fertilizer_stock_balance WHERE property_id=OLD.property_id AND fertilizer_master_id=OLD.fertilizer_master_id)+OLD.quantity_base
BEGIN SELECT RAISE(ABORT,'Insufficient fertilizer stock for this property'); END;
CREATE TRIGGER IF NOT EXISTS fertilizer_application_ai AFTER INSERT ON fertilizer_application BEGIN
  INSERT INTO fertilizer_stock_movement(property_id,fertilizer_master_id,movement_date,direction,movement_type,quantity_base,reference_type,reference_id,notes,created_by)
  VALUES(NEW.property_id,NEW.fertilizer_master_id,NEW.application_date,'OUT','APPLICATION',NEW.quantity_base,'APPLICATION',NEW.fertilizer_application_id,NEW.notes,NEW.created_by);
END;
CREATE TRIGGER IF NOT EXISTS fertilizer_application_au AFTER UPDATE ON fertilizer_application BEGIN
  UPDATE fertilizer_stock_movement SET property_id=NEW.property_id,fertilizer_master_id=NEW.fertilizer_master_id,movement_date=NEW.application_date,quantity_base=NEW.quantity_base,notes=NEW.notes
  WHERE reference_type='APPLICATION' AND reference_id=NEW.fertilizer_application_id;
END;
CREATE TRIGGER IF NOT EXISTS fertilizer_application_ad AFTER DELETE ON fertilizer_application BEGIN
  DELETE FROM fertilizer_stock_movement WHERE reference_type='APPLICATION' AND reference_id=OLD.fertilizer_application_id;
END;

CREATE TRIGGER IF NOT EXISTS fertilizer_adjustment_bi BEFORE INSERT ON fertilizer_adjustment
WHEN NEW.direction='OUT' AND NEW.quantity_base>(SELECT COALESCE(quantity_base,0) FROM fertilizer_stock_balance WHERE property_id=NEW.property_id AND fertilizer_master_id=NEW.fertilizer_master_id)
BEGIN SELECT RAISE(ABORT,'Insufficient fertilizer stock for outward adjustment'); END;
CREATE TRIGGER IF NOT EXISTS fertilizer_adjustment_ai AFTER INSERT ON fertilizer_adjustment BEGIN
  INSERT INTO fertilizer_stock_movement(property_id,fertilizer_master_id,movement_date,direction,movement_type,quantity_base,reference_type,reference_id,notes,created_by)
  VALUES(NEW.property_id,NEW.fertilizer_master_id,NEW.adjustment_date,NEW.direction,NEW.adjustment_type,NEW.quantity_base,'ADJUSTMENT',NEW.fertilizer_adjustment_id,NEW.reason,NEW.created_by);
END;
CREATE TRIGGER IF NOT EXISTS fertilizer_adjustment_bu BEFORE UPDATE ON fertilizer_adjustment
WHEN NEW.direction='OUT' AND NEW.quantity_base>(
  SELECT COALESCE(quantity_base,0) FROM fertilizer_stock_balance
  WHERE property_id=OLD.property_id AND fertilizer_master_id=OLD.fertilizer_master_id
)+CASE WHEN OLD.direction='OUT' THEN OLD.quantity_base ELSE -OLD.quantity_base END
BEGIN SELECT RAISE(ABORT,'Insufficient fertilizer stock for outward adjustment'); END;
CREATE TRIGGER IF NOT EXISTS fertilizer_adjustment_au AFTER UPDATE ON fertilizer_adjustment BEGIN
  UPDATE fertilizer_stock_movement SET property_id=NEW.property_id,fertilizer_master_id=NEW.fertilizer_master_id,movement_date=NEW.adjustment_date,direction=NEW.direction,movement_type=NEW.adjustment_type,quantity_base=NEW.quantity_base,notes=NEW.reason
  WHERE reference_type='ADJUSTMENT' AND reference_id=NEW.fertilizer_adjustment_id;
END;
CREATE TRIGGER IF NOT EXISTS fertilizer_adjustment_ad AFTER DELETE ON fertilizer_adjustment BEGIN
  DELETE FROM fertilizer_stock_movement WHERE reference_type='ADJUSTMENT' AND reference_id=OLD.fertilizer_adjustment_id;
END;
