-- Optional, append-only differences from estate rates. Apply after 0025.
CREATE TABLE labour_rate_exception (
 exception_id INTEGER PRIMARY KEY AUTOINCREMENT,
 property_id INTEGER NOT NULL REFERENCES property(property_id),
 labor_id INTEGER NOT NULL REFERENCES labors(labor_id),
 category TEXT NOT NULL CHECK(category IN ('daily','work','overtime')),
 type_id INTEGER NOT NULL DEFAULT 0,
 full_day REAL,
 half_day REAL,
 rate REAL,
 unit TEXT,
 effective_from TEXT NOT NULL,
 effective_to TEXT NOT NULL,
 notes TEXT NOT NULL DEFAULT '',
 created_by TEXT NOT NULL,
 created_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(date(effective_from) IS NOT NULL AND date(effective_to) IS NOT NULL AND effective_to>=effective_from),
 CHECK((category='daily' AND type_id=0 AND full_day IS NOT NULL AND half_day IS NOT NULL AND full_day>=0 AND half_day>=0 AND rate IS NULL AND unit IS NULL) OR (category IN ('work','overtime') AND type_id>0 AND rate IS NOT NULL AND rate>=0 AND unit IS NOT NULL AND full_day IS NULL AND half_day IS NULL))
);
CREATE INDEX labour_exception_dates ON labour_rate_exception(property_id,labor_id,category,type_id,effective_from,effective_to);
CREATE TRIGGER labour_exception_overlap BEFORE INSERT ON labour_rate_exception BEGIN
 SELECT RAISE(ABORT,'Labour exception dates overlap an existing version') WHERE EXISTS(SELECT 1 FROM labour_rate_exception r WHERE r.property_id=NEW.property_id AND r.labor_id=NEW.labor_id AND r.category=NEW.category AND r.type_id=NEW.type_id AND r.effective_from<=NEW.effective_to AND r.effective_to>=NEW.effective_from);
END;
CREATE TRIGGER labour_exception_no_update BEFORE UPDATE ON labour_rate_exception BEGIN
 SELECT RAISE(ABORT,'Labour exceptions are immutable. Create a new dated version');
END;
CREATE TRIGGER labour_exception_no_delete BEFORE DELETE ON labour_rate_exception BEGIN
 SELECT RAISE(ABORT,'Historical labour exceptions cannot be deleted');
END;
