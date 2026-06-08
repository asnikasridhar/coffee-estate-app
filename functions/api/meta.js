import { json, options, propertyIdFromUrl, userIdFromRequest, assertPropertyAccess, all, fail } from '../_shared/http.js';
export function onRequestOptions() { return options(); }
export async function onRequestGet({ request, env }) {
  try {
    const userId = userIdFromRequest(request);
    const propertyId = propertyIdFromUrl(request);
    if (propertyId) await assertPropertyAccess(env, userId, propertyId);
    const blockWhere = propertyId ? 'WHERE property_id = ?' : '';
    const blockParams = propertyId ? [propertyId] : [];
    const plantWhere = propertyId ? 'WHERE b.property_id = ?' : '';
    const plantParams = propertyId ? [propertyId] : [];
    return json({
      properties: await all(env, `SELECT property_id, property_name, total_acre, address_1, address_2, pincode, user_id FROM property WHERE user_id = ? ORDER BY property_name`, userId),
      blocks: await all(env, `SELECT block_id, block_name, property_id, block_area FROM blocks ${blockWhere} ORDER BY block_name`, ...blockParams),
      labors: await all(env, `SELECT l.labor_id, l.name AS labor_name, COALESCE(w.wage_fixed + w.wage_variable, 0) AS wage FROM labors l LEFT JOIN wage w ON w.labor_id = l.labor_id ORDER BY l.name`),
      users: await all(env, `SELECT user_id, username AS user_name, role FROM users ORDER BY username`),
      baseUnits: await all(env, `SELECT baseunit_id, baseunit_name FROM baseunit ORDER BY baseunit_name`),
      vendors: await all(env, `SELECT vendor_id, vendorname FROM vendor ORDER BY vendorname`),
      plants: await all(env, `SELECT pd.plant_id, pd.plant_type, pd.block_id FROM plantdetails pd LEFT JOIN blocks b ON b.block_id = pd.block_id ${plantWhere} ORDER BY pd.plant_type`, ...plantParams),
      expenseTypes: await all(env, `SELECT expensetype_id, expense_name, expense_code, current_rate FROM expensetype ORDER BY expense_name`),
      yieldTypes: await all(env, `SELECT yt.yieldtype_id, yt.yieldtype_name, yt.plant_id, pd.plant_type AS plant_name FROM yieldtype yt LEFT JOIN plantdetails pd ON pd.plant_id = yt.plant_id LEFT JOIN blocks b ON b.block_id = pd.block_id ${plantWhere} ORDER BY yt.yieldtype_name`, ...plantParams),
      yieldRates: await all(env, `SELECT yr.yieldrate_id, yr.yieldtype_id, yr.yieldrate_running_rate AS rate, yr.yieldrate_code AS season, yr.baseunit_id, bu.baseunit_name, yt.yieldtype_name FROM yieldrate yr LEFT JOIN baseunit bu ON bu.baseunit_id = yr.baseunit_id LEFT JOIN yieldtype yt ON yt.yieldtype_id = yr.yieldtype_id LEFT JOIN plantdetails pd ON pd.plant_id = yr.plant_id LEFT JOIN blocks b ON b.block_id = pd.block_id ${plantWhere} ORDER BY yr.yieldrate_code DESC, yr.yieldrate_id DESC`, ...plantParams),
      wages: await all(env, `SELECT w.wage_id, l.name || ' - ' || w.wage_fix_code AS wage_label FROM wage w JOIN labors l ON l.labor_id = w.labor_id ORDER BY w.wage_id DESC`),
      laborVendors: await all(env, `SELECT lv.laborvendor_id, l.name || ' / ' || v.vendorname || ' / ' || lv.laborvendorcode AS labor_vendor_label FROM laborvendor lv JOIN labors l ON l.labor_id = lv.labor_id JOIN vendor v ON v.vendor_id = lv.vendor_id ORDER BY lv.laborvendor_id DESC`),
      cropDetails: await all(env, `SELECT crop_id, 'Crop #' || crop_id || ' - ' || COALESCE(yield_obtained,0) || ' units' AS crop_label FROM cropdetails ${blockWhere.replace('property_id','property_id')} ORDER BY crop_id DESC`, ...blockParams)
    });
  } catch (err) { return fail(err, 'Meta failed'); }
}
