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
  const workRange = dashboardRange(req, 'work');

  const attendance = row(`SELECT COUNT(*) entries, COALESCE(SUM(attendance_value),0) labor_days FROM attendance WHERE date(entry_date) BETWEEN date(@from) AND date(@to) AND property_id = @propertyId`, { ...attendanceRange, propertyId });
  const laborCost = row(`SELECT ${money('SUM(a.attendance_value * COALESCE(w.wage_fixed + w.wage_variable,0))')} total FROM attendance a JOIN labors l ON l.labor_id = a.labor_id LEFT JOIN wage w ON w.wage_id=(SELECT w2.wage_id FROM wage w2 WHERE w2.labor_id=l.labor_id ORDER BY datetime(COALESCE(w2.modified_on,w2.created_on)) DESC,w2.wage_id DESC LIMIT 1) WHERE date(a.entry_date) BETWEEN date(@from) AND date(@to) AND a.property_id = @propertyId`, { ...attendanceRange, propertyId });
  const rainfall = row(`SELECT COALESCE(SUM(r.rain_amount),0) total, COUNT(*) entries FROM raindetails r LEFT JOIN blocks b ON b.block_id = r.block_id WHERE date(r.date_time) BETWEEN date(@from) AND date(@to) AND COALESCE(r.property_id,b.property_id) = @propertyId`, { ...rainfallRange, propertyId });
  const yieldTotal = row(`SELECT COALESCE(SUM(ys.yield_quantity),0) quantity, COUNT(*) entries, ${money('SUM(ys.yield_quantity * COALESCE(yr.yieldrate_running_rate,0))')} value FROM yield_settlement ys JOIN yieldrate yr ON yr.yieldrate_id = ys.yieldrate_id JOIN plantdetails pd ON pd.plant_id = yr.plant_id WHERE date(ys.yield_settlement_date) BETWEEN date(@from) AND date(@to) AND pd.property_id = @propertyId`, { ...yieldRange, propertyId });
  const expenses = row(`SELECT ${money('SUM(other_expense)')} total, COUNT(*) entries FROM running_expenses WHERE date(expense_occurence_date) BETWEEN date(@from) AND date(@to) AND property_id = @propertyId`, { ...expenseRange, propertyId });
  const income = row(`SELECT ${money('SUM(ci.income_amount)')} total, COUNT(*) entries FROM crop_income ci JOIN cropdetails cd ON cd.crop_id = ci.crop_id WHERE date(ci.received_date) BETWEEN date(@from) AND date(@to) AND cd.property_id = @propertyId`, { ...incomeRange, propertyId });
  const assets = row(`SELECT ${money('SUM(asset_price)')} value, COUNT(*) entries FROM currentasset WHERE isactive = 1 AND property_id = @propertyId AND (@from IS NULL OR procured_year IS NULL OR procured_year BETWEEN CAST(substr(@from,1,4) AS INTEGER) AND CAST(substr(@to,1,4) AS INTEGER))`, { ...assetRange, propertyId });
  const plantInventoryTotal = row(`SELECT COALESCE(SUM(plant_count),0) total_plants, COUNT(*) entries FROM plant_inventory WHERE property_id = @propertyId`, { propertyId });
  const plantByBlock = rows(`SELECT b.block_name, COALESCE(SUM(pi.plant_count),0) plant_count FROM plant_inventory pi JOIN blocks b ON b.block_id = pi.block_id WHERE pi.property_id = @propertyId GROUP BY b.block_id, b.block_name ORDER BY plant_count DESC`, { propertyId });
  const plantBySubBlock = rows(`SELECT b.block_name, COALESCE(NULLIF(pi.sub_block_name,''),'No sub-block') sub_block_name, COALESCE(SUM(pi.plant_count),0) plant_count FROM plant_inventory pi JOIN blocks b ON b.block_id = pi.block_id WHERE pi.property_id = @propertyId GROUP BY b.block_name, COALESCE(NULLIF(pi.sub_block_name,''),'No sub-block') ORDER BY plant_count DESC`, { propertyId });
  const plantByType = rows(`SELECT vm.variety_name plant_type, COALESCE(SUM(pi.plant_count),0) plant_count FROM plant_inventory pi JOIN variety_master vm ON vm.variety_master_id=pi.variety_master_id WHERE pi.property_id = @propertyId GROUP BY vm.variety_master_id, vm.variety_name ORDER BY plant_count DESC`, { propertyId });

  const profitLabor = row(`SELECT ${money('SUM(a.attendance_value * COALESCE(w.wage_fixed + w.wage_variable,0))')} total FROM attendance a LEFT JOIN wage w ON w.wage_id=(SELECT w2.wage_id FROM wage w2 WHERE w2.labor_id=a.labor_id ORDER BY datetime(COALESCE(w2.modified_on,w2.created_on)) DESC,w2.wage_id DESC LIMIT 1) WHERE date(a.entry_date) BETWEEN date(@from) AND date(@to) AND a.property_id = @propertyId`, { ...profitRange, propertyId });
  const profitExpenses = row(`SELECT ${money('SUM(other_expense)')} total FROM running_expenses WHERE date(expense_occurence_date) BETWEEN date(@from) AND date(@to) AND property_id = @propertyId`, { ...profitRange, propertyId });
  const profitIncome = row(`SELECT ${money('SUM(ci.income_amount)')} total FROM crop_income ci JOIN cropdetails cd ON cd.crop_id = ci.crop_id WHERE date(ci.received_date) BETWEEN date(@from) AND date(@to) AND cd.property_id = @propertyId`, { ...profitRange, propertyId });
  const profitYield = row(`SELECT ${money('SUM(ys.yield_quantity * COALESCE(yr.yieldrate_running_rate,0))')} total FROM yield_settlement ys JOIN yieldrate yr ON yr.yieldrate_id = ys.yieldrate_id JOIN plantdetails pd ON pd.plant_id = yr.plant_id WHERE date(ys.yield_settlement_date) BETWEEN date(@from) AND date(@to) AND pd.property_id = @propertyId`, { ...profitRange, propertyId });
  const profit = Number(profitIncome.total || 0) + Number(profitYield.total || 0) - Number(profitExpenses.total || 0) - Number(profitLabor.total || 0);

  const recentAttendance = rows(`SELECT a.attendance_id, date(a.entry_date) entry_date, l.name AS labor_name, p.property_name, a.attendance_value, COALESCE(w.wage_fixed + w.wage_variable, 0) AS wage, ROUND(a.attendance_value * COALESCE(w.wage_fixed + w.wage_variable,0), 2) cost FROM attendance a JOIN labors l ON l.labor_id = a.labor_id LEFT JOIN wage w ON w.wage_id=(SELECT w2.wage_id FROM wage w2 WHERE w2.labor_id=l.labor_id ORDER BY datetime(COALESCE(w2.modified_on,w2.created_on)) DESC,w2.wage_id DESC LIMIT 1) JOIN property p ON p.property_id = a.property_id WHERE date(a.entry_date) BETWEEN date(@from) AND date(@to) AND a.property_id = @propertyId ORDER BY a.entry_date DESC, a.attendance_id DESC LIMIT 12`, { ...recentRange, propertyId });
  const rainByBlock = rows(`SELECT p.property_name, COALESCE(b.block_name,'Property level') block_name, COALESCE(SUM(r.rain_amount),0) total_rain FROM raindetails r LEFT JOIN blocks b ON b.block_id = r.block_id JOIN property p ON p.property_id = COALESCE(r.property_id,b.property_id) WHERE date(r.date_time) BETWEEN date(@from) AND date(@to) AND COALESCE(r.property_id,b.property_id) = @propertyId GROUP BY p.property_name, COALESCE(b.block_name,'Property level') ORDER BY total_rain DESC`, { ...rainfallRange, propertyId });
  const propertyProfit = rows(`SELECT p.property_name,@from from_date,@to to_date,
    (SELECT ${money('SUM(ci.income_amount)')} FROM crop_income ci JOIN cropdetails cd ON cd.crop_id=ci.crop_id WHERE cd.property_id=p.property_id AND date(ci.received_date) BETWEEN date(@from) AND date(@to)) income,
    (SELECT ${money('SUM(re.other_expense)')} FROM running_expenses re WHERE re.property_id=p.property_id AND date(re.expense_occurence_date) BETWEEN date(@from) AND date(@to)) expense
    FROM property p WHERE p.property_id=@propertyId ORDER BY p.property_name`,{...profitRange,propertyId});
  const workAssignmentTotal = row(`SELECT COUNT(*) entries, COUNT(DISTINCT labor_id) labor_count FROM work_assignment WHERE date(work_date) BETWEEN date(@from) AND date(@to) AND property_id = @propertyId`, { ...workRange, propertyId });
  const workActivityReport = rows(`SELECT date(wa.work_date) work_date, act.work_activity_type, act.work_activity_name, b.block_name, COUNT(DISTINCT wa.labor_id) labor_count, COUNT(*) assignment_count FROM work_assignment wa JOIN work_activity act ON act.work_activity_id = wa.work_activity_id JOIN blocks b ON b.block_id = wa.block_id WHERE date(wa.work_date) BETWEEN date(@from) AND date(@to) AND wa.property_id = @propertyId GROUP BY date(wa.work_date), act.work_activity_type, act.work_activity_name, b.block_name ORDER BY date(wa.work_date) DESC, act.work_activity_type, act.work_activity_name, b.block_name`, { ...workRange, propertyId });
  const workByActivity = rows(`SELECT act.work_activity_name, act.work_activity_type, COUNT(DISTINCT wa.labor_id) labor_count, COUNT(*) assignment_count FROM work_assignment wa JOIN work_activity act ON act.work_activity_id = wa.work_activity_id WHERE date(wa.work_date) BETWEEN date(@from) AND date(@to) AND wa.property_id = @propertyId GROUP BY act.work_activity_id, act.work_activity_name, act.work_activity_type ORDER BY labor_count DESC, assignment_count DESC`, { ...workRange, propertyId });

  const management={
    todayWork:row(`SELECT COUNT(*) count FROM work_assignment WHERE property_id=@propertyId AND date(work_date)=date('now','localtime')`,{propertyId})?.count||0,
    activeLabour:row(`SELECT COUNT(DISTINCT l.labor_id) count FROM labors l JOIN attendance a ON a.labor_id=l.labor_id WHERE a.property_id=@propertyId AND date(a.entry_date)=date('now','localtime') AND a.attendance_value>0`,{propertyId})?.count||0,
    monthlyExpense:row(`SELECT COALESCE(SUM(other_expense),0) total FROM running_expenses WHERE property_id=@propertyId AND strftime('%Y-%m',expense_occurence_date)=strftime('%Y-%m','now','localtime')`,{propertyId})?.total||0,
    lowStock:row(`SELECT COUNT(*) count FROM fertilizer_stock_balance s JOIN fertilizer_master f ON f.fertilizer_master_id=s.fertilizer_master_id WHERE s.property_id=@propertyId AND s.quantity_base<=f.minimum_stock_base`,{propertyId})?.count||0,
    activeBlocks:row(`SELECT COUNT(*) count,COALESCE(SUM(block_area),0) area FROM blocks WHERE property_id=@propertyId AND parent_block_id IS NULL`,{propertyId}),
    rainMonth:row(`SELECT COALESCE(SUM(rain_amount),0) total FROM raindetails WHERE property_id=@propertyId AND strftime('%Y-%m',date_time)=strftime('%Y-%m','now','localtime')`,{propertyId})?.total||0,
    mainCrops:rows(`SELECT crop_name FROM crop_master WHERE property_id=@propertyId ORDER BY crop_name LIMIT 4`,{propertyId}).map(item=>item.crop_name),
    upcomingWork:rows(`SELECT date(wa.work_date) work_date,act.work_activity_name,COUNT(DISTINCT wa.labor_id) labor_count FROM work_assignment wa JOIN work_activity act ON act.work_activity_id=wa.work_activity_id WHERE wa.property_id=@propertyId AND date(wa.work_date)>date('now','localtime') AND date(wa.work_date)<=date('now','localtime','+2 day') GROUP BY date(wa.work_date),act.work_activity_id ORDER BY date(wa.work_date)`,{propertyId})
  };

  res.json({ ranges: { attendance: attendanceRange, rainfall: rainfallRange, yield: yieldRange, expenses: expenseRange, income: incomeRange, assets: assetRange, profit: profitRange, recent: recentRange, work: workRange }, attendance, laborCost, rainfall, yieldTotal, expenses, income, assets, profit, plantInventoryTotal, plantByBlock, plantBySubBlock, plantByType, workAssignmentTotal, workActivityReport, workByActivity, recentAttendance, rainByBlock, propertyProfit, management });
}));

export default router;
