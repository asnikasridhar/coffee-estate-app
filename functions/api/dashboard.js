import { json, options, propertyIdFromUrl, userIdFromRequest, assertPropertyAccess, dashboardRange, all, first, fail } from '../_shared/http.js';
export function onRequestOptions() { return options(); }
export async function onRequestGet({ request, env }) {
  try {
    const userId = userIdFromRequest(request);
    const propertyId = propertyIdFromUrl(request);
    if (!propertyId) return json({ error: 'Select a property before viewing dashboard' }, 400);
    await assertPropertyAccess(env, userId, propertyId);
    const attendanceRange = dashboardRange(request, 'attendance');
    const rainfallRange = dashboardRange(request, 'rainfall');
    const yieldRange = dashboardRange(request, 'yield');
    const expenseRange = dashboardRange(request, 'expenses');
    const incomeRange = dashboardRange(request, 'income');
    const assetRange = dashboardRange(request, 'assets');
    const profitRange = dashboardRange(request, 'profit');
    const recentRange = dashboardRange(request, 'recent');
    const attendance = await first(env, `SELECT COUNT(*) entries, COALESCE(SUM(attendance_value),0) labor_days FROM attendance WHERE date(entry_date) BETWEEN date(?) AND date(?) AND property_id = ?`, attendanceRange.from, attendanceRange.to, propertyId);
    const laborCost = await first(env, `SELECT ROUND(COALESCE(SUM(a.attendance_value * COALESCE(w.wage_fixed + w.wage_variable,0)),0),2) total FROM attendance a LEFT JOIN wage w ON w.labor_id = a.labor_id WHERE date(a.entry_date) BETWEEN date(?) AND date(?) AND a.property_id = ?`, attendanceRange.from, attendanceRange.to, propertyId);
    const rainfall = await first(env, `SELECT COALESCE(SUM(r.rain_amount),0) total, COUNT(*) entries FROM raindetails r JOIN blocks b ON b.block_id = r.block_id WHERE date(r.date_time) BETWEEN date(?) AND date(?) AND b.property_id = ?`, rainfallRange.from, rainfallRange.to, propertyId);
    const yieldTotal = await first(env, `SELECT COALESCE(SUM(ys.yield_quantity),0) quantity, COUNT(*) entries, ROUND(COALESCE(SUM(ys.yield_quantity * COALESCE(yr.yieldrate_running_rate,0)),0),2) value FROM yield_settlement ys JOIN yieldrate yr ON yr.yieldrate_id = ys.yieldrate_id JOIN plantdetails pd ON pd.plant_id = yr.plant_id JOIN blocks b ON b.block_id = pd.block_id WHERE date(ys.yield_settlement_date) BETWEEN date(?) AND date(?) AND b.property_id = ?`, yieldRange.from, yieldRange.to, propertyId);
    const expenses = await first(env, `SELECT ROUND(COALESCE(SUM(other_expense),0),2) total, COUNT(*) entries FROM running_expenses WHERE date(expense_occurence_date) BETWEEN date(?) AND date(?) AND property_id = ?`, expenseRange.from, expenseRange.to, propertyId);
    const income = await first(env, `SELECT ROUND(COALESCE(SUM(ci.income_amount),0),2) total, COUNT(*) entries FROM crop_income ci JOIN cropdetails cd ON cd.crop_id = ci.crop_id WHERE date(ci.received_date) BETWEEN date(?) AND date(?) AND cd.property_id = ?`, incomeRange.from, incomeRange.to, propertyId);
    const assets = await first(env, `SELECT ROUND(COALESCE(SUM(asset_price),0),2) value, COUNT(*) entries FROM currentasset WHERE COALESCE(isactive,1) = 1 AND property_id = ?`, propertyId);
    const plantInventoryTotal = await first(env, `SELECT COALESCE(SUM(plant_count),0) total_plants, COUNT(*) entries FROM plant_inventory WHERE property_id = ?`, propertyId);
    const plantByBlock = await all(env, `SELECT b.block_name, COALESCE(SUM(pi.plant_count),0) plant_count FROM plant_inventory pi JOIN blocks b ON b.block_id = pi.block_id WHERE pi.property_id = ? GROUP BY b.block_id, b.block_name ORDER BY plant_count DESC`, propertyId);
    const plantBySubBlock = await all(env, `SELECT b.block_name, COALESCE(NULLIF(pi.sub_block_name,''),'No sub-block') sub_block_name, COALESCE(SUM(pi.plant_count),0) plant_count FROM plant_inventory pi JOIN blocks b ON b.block_id = pi.block_id WHERE pi.property_id = ? GROUP BY b.block_name, COALESCE(NULLIF(pi.sub_block_name,''),'No sub-block') ORDER BY plant_count DESC`, propertyId);
    const plantByType = await all(env, `SELECT pd.plant_type, COALESCE(SUM(pi.plant_count),0) plant_count FROM plant_inventory pi JOIN plantdetails pd ON pd.plant_id = pi.plant_id WHERE pi.property_id = ? GROUP BY pd.plant_id, pd.plant_type ORDER BY plant_count DESC`, propertyId);
    const profit = { total: Number(income?.total || 0) - Number(expenses?.total || 0) };
    const recentAttendance = await all(env, `SELECT a.attendance_id, date(a.entry_date) entry_date, l.name AS labor_name, p.property_name, a.attendance_value, ROUND(a.attendance_value * COALESCE(w.wage_fixed + w.wage_variable,0), 2) cost FROM attendance a JOIN labors l ON l.labor_id = a.labor_id LEFT JOIN wage w ON w.labor_id = l.labor_id JOIN property p ON p.property_id = a.property_id WHERE date(a.entry_date) BETWEEN date(?) AND date(?) AND a.property_id = ? ORDER BY a.entry_date DESC, a.attendance_id DESC LIMIT 8`, recentRange.from, recentRange.to, propertyId);
    const rainByBlock = await all(env, `SELECT p.property_name, b.block_name, COALESCE(SUM(r.rain_amount),0) total_rain FROM raindetails r LEFT JOIN blocks b ON b.block_id = r.block_id LEFT JOIN property p ON p.property_id = b.property_id WHERE date(r.date_time) BETWEEN date(?) AND date(?) AND b.property_id = ? GROUP BY p.property_name, b.block_name ORDER BY total_rain DESC`, rainfallRange.from, rainfallRange.to, propertyId);
    const propertyProfit = await all(env, `SELECT p.property_id, p.property_name, ROUND(COALESCE(SUM(COALESCE(ci.income_amount,0)),0),2) income, ROUND(COALESCE(SUM(COALESCE(re.other_expense,0)),0),2) expense FROM property p LEFT JOIN cropdetails cd ON cd.property_id = p.property_id LEFT JOIN crop_income ci ON ci.crop_id = cd.crop_id AND date(ci.received_date) BETWEEN date(?) AND date(?) LEFT JOIN running_expenses re ON re.property_id = p.property_id AND date(re.expense_occurence_date) BETWEEN date(?) AND date(?) WHERE p.property_id = ? GROUP BY p.property_id ORDER BY p.property_name`, profitRange.from, profitRange.to, profitRange.from, profitRange.to, propertyId);
    return json({ ranges: { attendance: attendanceRange, rainfall: rainfallRange, yield: yieldRange, expenses: expenseRange, income: incomeRange, assets: assetRange, profit: profitRange, recent: recentRange }, attendance, laborCost, rainfall, yieldTotal, expenses, income, assets, profit, plantInventoryTotal, plantByBlock, plantBySubBlock, plantByType, recentAttendance, rainByBlock, propertyProfit });
  } catch (err) { return fail(err, 'Dashboard failed'); }
}
