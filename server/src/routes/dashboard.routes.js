import { Router } from 'express';
import { row, rows } from '../db.js';
import { requestContext, requireOwner, assertPropertyAccess } from '../middleware/context.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dashboardRange } from '../utils/dateRange.js';
import { money } from '../utils/pick.js';

const router = Router();

router.get('/', asyncHandler((req, res) => {
  const { userId, propertyId } = requestContext(req);
  if (userId) requireOwner(userId);
  if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  if (!propertyId) return res.status(400).json({ error: 'Select a property before viewing dashboard' });

  const attendanceRange = dashboardRange(req, 'attendance');
  const rainfallRange = dashboardRange(req, 'rainfall');
  const yieldRange = dashboardRange(req, 'yield');
  const expenseRange = dashboardRange(req, 'expenses');
  const incomeRange = dashboardRange(req, 'income');
  const assetRange = dashboardRange(req, 'assets');
  const profitRange = dashboardRange(req, 'profit');
  const recentRange = dashboardRange(req, 'recent');

  const attendance = row(`SELECT COUNT(*) entries, COALESCE(SUM(attendance_value),0) labor_days FROM attendance WHERE date(entry_date) BETWEEN date(@from) AND date(@to) AND property_id = @propertyId`, { ...attendanceRange, propertyId });
  const laborCost = row(`SELECT ${money('SUM(a.attendance_value * COALESCE(w.wage_fixed + w.wage_variable,0))')} total FROM attendance a JOIN labors l ON l.labor_id = a.labor_id LEFT JOIN wage w ON w.labor_id = l.labor_id WHERE date(a.entry_date) BETWEEN date(@from) AND date(@to) AND a.property_id = @propertyId`, { ...attendanceRange, propertyId });
  const rainfall = row(`SELECT COALESCE(SUM(r.rain_amount),0) total, COUNT(*) entries FROM raindetails r JOIN blocks b ON b.block_id = r.block_id WHERE date(r.date_time) BETWEEN date(@from) AND date(@to) AND b.property_id = @propertyId`, { ...rainfallRange, propertyId });
  const yieldTotal = row(`SELECT COALESCE(SUM(ys.yield_quantity),0) quantity, COUNT(*) entries, ${money('SUM(ys.yield_quantity * COALESCE(yr.yieldrate_running_rate,0))')} value FROM yield_settlement ys JOIN yieldrate yr ON yr.yieldrate_id = ys.yieldrate_id JOIN plantdetails pd ON pd.plant_id = yr.plant_id JOIN blocks b ON b.block_id = pd.block_id WHERE date(ys.yield_settlement_date) BETWEEN date(@from) AND date(@to) AND b.property_id = @propertyId`, { ...yieldRange, propertyId });
  const expenses = row(`SELECT ${money('SUM(other_expense)')} total, COUNT(*) entries FROM running_expenses WHERE date(expense_occurence_date) BETWEEN date(@from) AND date(@to) AND property_id = @propertyId`, { ...expenseRange, propertyId });
  const income = row(`SELECT ${money('SUM(ci.income_amount)')} total, COUNT(*) entries FROM crop_income ci JOIN cropdetails cd ON cd.crop_id = ci.crop_id WHERE date(ci.received_date) BETWEEN date(@from) AND date(@to) AND cd.property_id = @propertyId`, { ...incomeRange, propertyId });
  const assets = row(`SELECT ${money('SUM(asset_price)')} value, COUNT(*) entries FROM currentasset WHERE isactive = 1 AND property_id = @propertyId AND (@from IS NULL OR procured_year IS NULL OR procured_year BETWEEN CAST(substr(@from,1,4) AS INTEGER) AND CAST(substr(@to,1,4) AS INTEGER))`, { ...assetRange, propertyId });
  const plantInventoryTotal = row(`SELECT COALESCE(SUM(plant_count),0) total_plants, COUNT(*) entries FROM plant_inventory WHERE property_id = @propertyId`, { propertyId });
  const plantByBlock = rows(`SELECT b.block_name, COALESCE(SUM(pi.plant_count),0) plant_count FROM plant_inventory pi JOIN blocks b ON b.block_id = pi.block_id WHERE pi.property_id = @propertyId GROUP BY b.block_id, b.block_name ORDER BY plant_count DESC`, { propertyId });
  const plantBySubBlock = rows(`SELECT b.block_name, COALESCE(NULLIF(pi.sub_block_name,''),'No sub-block') sub_block_name, COALESCE(SUM(pi.plant_count),0) plant_count FROM plant_inventory pi JOIN blocks b ON b.block_id = pi.block_id WHERE pi.property_id = @propertyId GROUP BY b.block_name, COALESCE(NULLIF(pi.sub_block_name,''),'No sub-block') ORDER BY plant_count DESC`, { propertyId });
  const plantByType = rows(`SELECT pd.plant_type, COALESCE(SUM(pi.plant_count),0) plant_count FROM plant_inventory pi JOIN plantdetails pd ON pd.plant_id = pi.plant_id WHERE pi.property_id = @propertyId GROUP BY pd.plant_id, pd.plant_type ORDER BY plant_count DESC`, { propertyId });

  const profitLabor = row(`SELECT ${money('SUM(a.attendance_value * COALESCE(w.wage_fixed + w.wage_variable,0))')} total FROM attendance a LEFT JOIN wage w ON w.labor_id = a.labor_id WHERE date(a.entry_date) BETWEEN date(@from) AND date(@to) AND a.property_id = @propertyId`, { ...profitRange, propertyId });
  const profitExpenses = row(`SELECT ${money('SUM(other_expense)')} total FROM running_expenses WHERE date(expense_occurence_date) BETWEEN date(@from) AND date(@to) AND property_id = @propertyId`, { ...profitRange, propertyId });
  const profitIncome = row(`SELECT ${money('SUM(ci.income_amount)')} total FROM crop_income ci JOIN cropdetails cd ON cd.crop_id = ci.crop_id WHERE date(ci.received_date) BETWEEN date(@from) AND date(@to) AND cd.property_id = @propertyId`, { ...profitRange, propertyId });
  const profitYield = row(`SELECT ${money('SUM(ys.yield_quantity * COALESCE(yr.yieldrate_running_rate,0))')} total FROM yield_settlement ys JOIN yieldrate yr ON yr.yieldrate_id = ys.yieldrate_id JOIN plantdetails pd ON pd.plant_id = yr.plant_id JOIN blocks b ON b.block_id = pd.block_id WHERE date(ys.yield_settlement_date) BETWEEN date(@from) AND date(@to) AND b.property_id = @propertyId`, { ...profitRange, propertyId });
  const profit = Number(profitIncome.total || 0) + Number(profitYield.total || 0) - Number(profitExpenses.total || 0) - Number(profitLabor.total || 0);

  const recentAttendance = rows(`SELECT a.attendance_id, date(a.entry_date) entry_date, l.name AS labor_name, p.property_name, a.attendance_value, COALESCE(w.wage_fixed + w.wage_variable, 0) AS wage, ROUND(a.attendance_value * COALESCE(w.wage_fixed + w.wage_variable,0), 2) cost FROM attendance a JOIN labors l ON l.labor_id = a.labor_id LEFT JOIN wage w ON w.labor_id = l.labor_id JOIN property p ON p.property_id = a.property_id WHERE date(a.entry_date) BETWEEN date(@from) AND date(@to) AND a.property_id = @propertyId ORDER BY a.entry_date DESC, a.attendance_id DESC LIMIT 12`, { ...recentRange, propertyId });
  const rainByBlock = rows(`SELECT p.property_name, b.block_name, COALESCE(SUM(r.rain_amount),0) total_rain FROM raindetails r JOIN blocks b ON b.block_id = r.block_id JOIN property p ON p.property_id = b.property_id WHERE date(r.date_time) BETWEEN date(@from) AND date(@to) AND b.property_id = @propertyId GROUP BY p.property_name, b.block_name ORDER BY total_rain DESC`, { ...rainfallRange, propertyId });
  const propertyProfit = rows(`SELECT p.property_name, @from AS from_date, @to AS to_date, ${money('SUM(COALESCE(ci.income_amount,0))')} income, ${money('SUM(COALESCE(re.other_expense,0))')} expense FROM property p LEFT JOIN cropdetails cd ON cd.property_id = p.property_id LEFT JOIN crop_income ci ON ci.crop_id = cd.crop_id AND date(ci.received_date) BETWEEN date(@from) AND date(@to) LEFT JOIN running_expenses re ON re.property_id = p.property_id AND date(re.expense_occurence_date) BETWEEN date(@from) AND date(@to) WHERE p.property_id = @propertyId GROUP BY p.property_id ORDER BY p.property_name`, { ...profitRange, propertyId });

  res.json({ ranges: { attendance: attendanceRange, rainfall: rainfallRange, yield: yieldRange, expenses: expenseRange, income: incomeRange, assets: assetRange, profit: profitRange, recent: recentRange }, attendance, laborCost, rainfall, yieldTotal, expenses, income, assets, profit, plantInventoryTotal, plantByBlock, plantBySubBlock, plantByType, recentAttendance, rainByBlock, propertyProfit });
}));

export default router;
