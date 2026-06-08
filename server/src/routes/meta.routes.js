import { Router } from 'express';
import { rows } from '../db.js';
import { requireScopedProperty } from '../middleware/context.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler((req, res) => {
  const { userId, propertyId } = requireScopedProperty(req);
  const propertyFilter = propertyId ? 'WHERE property_id = @propertyId' : '';

  res.json({
    properties: userId
      ? rows('SELECT property_id, property_name, total_acre, address_1, address_2, pincode FROM property WHERE user_id = @userId ORDER BY property_name', { userId })
      : rows('SELECT property_id, property_name, total_acre, address_1, address_2, pincode FROM property ORDER BY property_name'),
    blocks: rows(`SELECT block_id, block_name, property_id, block_area FROM blocks ${propertyFilter} ORDER BY block_name`, { propertyId }),
    labors: rows('SELECT l.labor_id, l.name AS labor_name, COALESCE(w.wage_fixed + w.wage_variable, 0) AS wage FROM labors l LEFT JOIN wage w ON w.labor_id = l.labor_id ORDER BY l.name'),
    users: rows('SELECT user_id, username AS user_name, role FROM users ORDER BY username'),
    baseUnits: rows('SELECT baseunit_id, baseunit_name FROM baseunit ORDER BY baseunit_name'),
    vendors: rows('SELECT vendor_id, vendorname FROM vendor ORDER BY vendorname'),
    plants: rows(`SELECT pd.plant_id, pd.plant_type, pd.block_id FROM plantdetails pd LEFT JOIN blocks b ON b.block_id = pd.block_id ${propertyId ? 'WHERE b.property_id = @propertyId' : ''} ORDER BY pd.plant_type`, { propertyId }),
    expenseTypes: rows('SELECT expensetype_id, expense_name, expense_code, current_rate FROM expensetype ORDER BY expense_name'),
    yieldTypes: rows(`SELECT yt.yieldtype_id, yt.yieldtype_name, yt.plant_id, pd.plant_type AS plant_name FROM yieldtype yt LEFT JOIN plantdetails pd ON pd.plant_id = yt.plant_id LEFT JOIN blocks b ON b.block_id = pd.block_id ${propertyId ? 'WHERE b.property_id = @propertyId' : ''} ORDER BY yt.yieldtype_name`, { propertyId }),
    yieldRates: rows(`SELECT yr.yieldrate_id, yr.yieldtype_id, yr.yieldrate_running_rate AS rate, yr.yieldrate_code AS season, yr.baseunit_id, bu.baseunit_name, yt.yieldtype_name FROM yieldrate yr LEFT JOIN baseunit bu ON bu.baseunit_id = yr.baseunit_id LEFT JOIN yieldtype yt ON yt.yieldtype_id = yr.yieldtype_id LEFT JOIN plantdetails pd ON pd.plant_id = yr.plant_id LEFT JOIN blocks b ON b.block_id = pd.block_id ${propertyId ? 'WHERE b.property_id = @propertyId' : ''} ORDER BY yr.yieldrate_code DESC, yr.yieldrate_id DESC`, { propertyId }),
    wages: rows(`SELECT w.wage_id, l.name || ' - ' || w.wage_fix_code AS wage_label FROM wage w JOIN labors l ON l.labor_id = w.labor_id ORDER BY w.wage_id DESC`),
    laborVendors: rows(`SELECT lv.laborvendor_id, l.name || ' / ' || v.vendorname || ' / ' || lv.laborvendorcode AS labor_vendor_label FROM laborvendor lv JOIN labors l ON l.labor_id = lv.labor_id JOIN vendor v ON v.vendor_id = lv.vendor_id ORDER BY lv.laborvendor_id DESC`),
    cropDetails: rows(`SELECT crop_id, 'Crop #' || crop_id || ' - ' || COALESCE(yield_obtained,0) || ' units' AS crop_label FROM cropdetails ${propertyFilter} ORDER BY crop_id DESC`, { propertyId })
  });
}));

export default router;
