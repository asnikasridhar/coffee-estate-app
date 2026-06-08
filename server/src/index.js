import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';
import { rows, row, run, insert, update } from './db.js';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT || 8787);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const today = () => new Date().toISOString().slice(0, 10);
const dateRange = req => ({ from: req.query.from || '2024-01-01', to: req.query.to || today() });
const money = expr => `ROUND(COALESCE(${expr},0),2)`;
const pick = (obj, allowed) => Object.fromEntries(Object.entries(obj).filter(([k]) => allowed.includes(k)));
const q = req => ({ userId: Number(req.query.userId || req.header('x-user-id') || 0) || null, propertyId: Number(req.query.propertyId || req.header('x-property-id') || 0) || null });
const requireOwner = (userId) => {
  const owner = row('SELECT user_id, username, email, role FROM users WHERE user_id = ? AND is_active = 1', [userId]);
  if (!owner) throw new Error('Invalid or inactive user');
  return owner;
};
const assertPropertyAccess = (userId, propertyId) => {
  if (!propertyId) throw new Error('Select or create a property first');
  const p = row('SELECT property_id FROM property WHERE property_id = ? AND user_id = ?', [propertyId, userId]);
  if (!p) throw new Error('Selected property does not belong to this owner');
};

const endpoints = {
  properties: { table: 'property', id: 'property_id', order: 'property_name', propertyMode: 'owner', allowed: ['property_name','total_acre','address_1','address_2','pincode','user_id','created_by','modified_by'] },
  blocks: { table: 'blocks', id: 'block_id', order: 'block_name', propertyMode: 'direct', allowed: ['block_name','block_area','property_id','parent_block_id'] },
  labors: { table: 'labors', id: 'labor_id', order: 'name', propertyMode: 'global', allowed: ['user_id','name','age','adhar_card','bank_details','health_history','photo','address','emergency_details','created_by','modified_by'] },
  vendors: { table: 'vendor', id: 'vendor_id', order: 'vendorname', propertyMode: 'global', allowed: ['vendorname','description','created_by','modified_by'] },
  laborVendors: { table: 'laborvendor', id: 'laborvendor_id', order: 'laborvendor_id DESC', propertyMode: 'global', allowed: ['labor_id','vendor_id','vendor_labor_percentage','laborvendorcode','created_by','modified_by'] },
  vendorSettlements: { table: 'laborvendor_settlement', id: 'laborvendor_settlement_id', order: 'running_wage_transaction_date DESC', propertyMode: 'global', allowed: ['laborvendor_id','settled_amount','advance_amount','running_wage_transaction_date','created_by','modified_by'] },
  wages: { table: 'wage', id: 'wage_id', order: 'wage_id DESC', propertyMode: 'global', allowed: ['wage_fixed','wage_variable','wage_fix_code','wage_ot_perhr_price','labor_id','created_by','modified_by'] },
  wageSettlements: { table: 'wage_settlement', id: 'running_wage_id', order: 'running_wage_transaction_date DESC', propertyMode: 'global', allowed: ['wage_id','settled_amount','advance_amount','running_wage_transaction_date','created_by','modified_by'] },
  plants: { table: 'plantdetails', id: 'plant_id', order: 'plant_type', propertyMode: 'viaBlock', allowed: ['plant_type','details','block_id','plantdetailscol','created_by','modified_by'] },
  yieldTypes: { table: 'yieldtype', id: 'yieldtype_id', order: 'yieldtype_name', propertyMode: 'viaPlant', allowed: ['yieldtype_name','plant_id','created_by','modified_by'] },
  yieldRates: { table: 'yieldrate', id: 'yieldrate_id', order: 'yieldrate_id DESC', propertyMode: 'viaPlant', allowed: ['plant_id','yieldtype_id','yieldrate_code','yieldrate_running_rate','baseunit_id','created_by','modified_by'] },
  assets: { table: 'currentasset', id: 'currentasset_id', order: 'asset_name', propertyMode: 'direct', allowed: ['asset_name','asset_price','procured_year','isactive','property_id','asset_procured_source','created_by','modified_by'] },
  expenseTypes: { table: 'expensetype', id: 'expensetype_id', order: 'expense_name', propertyMode: 'global', allowed: ['expense_code','expense_name','current_rate','baseunit_id','created_by','modified_by'] },
  expenses: { table: 'running_expenses', id: 'expense_id', order: 'expense_occurence_date DESC', propertyMode: 'direct', allowed: ['expensetype_id','property_id','expense_code','expense_occurence_date','other_expense','created_by','modified_by'] },
  cropDetails: { table: 'cropdetails', id: 'crop_id', order: 'crop_id DESC', propertyMode: 'direct', allowed: ['yield_obtained','selling_price','property_id','other_detail','created_by','modified_by'] },
  cropIncome: { table: 'crop_income', id: 'income_id', order: 'received_date DESC', propertyMode: 'viaCrop', allowed: ['crop_id','income_amount','received_date','created_by','modified_by'] },
  fertilizers: { table: 'fertilizers', id: 'fertilizer_id', order: 'date_of_application DESC', propertyMode: 'direct', allowed: ['fertilizer_name','date_of_application','property_id','other_details','created_by','modified_by'] },
  reports: { table: 'reports', id: 'report_id', order: 'report_id DESC', propertyMode: 'direct', allowed: ['total_expenditure','total_revenue','profit_loss','property_id','created_by','modified_by'] },
  baseUnits: { table: 'baseunit', id: 'baseunit_id', order: 'baseunit_name', propertyMode: 'global', allowed: ['baseunit_name','created_by','modified_by'] }
};

function scopedSelect(resource, cfg, userId, propertyId) {
  const base = `SELECT * FROM ${cfg.table}`;
  if (resource === 'properties') return rows(`${base} WHERE user_id = @userId ORDER BY ${cfg.order} LIMIT 500`, { userId });
  if (!propertyId || cfg.propertyMode === 'global') return rows(`${base} ORDER BY ${cfg.order} LIMIT 500`);
  if (cfg.propertyMode === 'direct') return rows(`${base} WHERE property_id = @propertyId ORDER BY ${cfg.order} LIMIT 500`, { propertyId });
  if (cfg.propertyMode === 'viaBlock') return rows(`${base} WHERE block_id IN (SELECT block_id FROM blocks WHERE property_id = @propertyId) ORDER BY ${cfg.order} LIMIT 500`, { propertyId });
  if (cfg.propertyMode === 'viaPlant') return rows(`${base} WHERE plant_id IN (SELECT pd.plant_id FROM plantdetails pd JOIN blocks b ON b.block_id = pd.block_id WHERE b.property_id = @propertyId) ORDER BY ${cfg.order} LIMIT 500`, { propertyId });
  if (cfg.propertyMode === 'viaCrop') return rows(`${base} WHERE crop_id IN (SELECT crop_id FROM cropdetails WHERE property_id = @propertyId) ORDER BY ${cfg.order} LIMIT 500`, { propertyId });
  return rows(`${base} ORDER BY ${cfg.order} LIMIT 500`);
}
function applyProperty(resource, payload, propertyId) {
  if (['blocks','assets','expenses','cropDetails','fertilizers','reports'].includes(resource)) return { ...payload, property_id: Number(payload.property_id || propertyId) };
  return payload;
}

app.get('/api/health', (_, res) => res.json({ ok: true, app: 'coffee-estate-api', phases: 'all-with-login-property-scope' }));

app.post('/api/auth/login', asyncHandler((req, res) => {
  const { username, password } = z.object({ username: z.string().min(1), password: z.string().min(1) }).parse(req.body);
  const user = row(`SELECT user_id, username, email, role, password FROM users WHERE is_active = 1 AND (lower(username)=lower(@username) OR lower(email)=lower(@username))`, { username });
  if (!user) return res.status(401).json({ error: 'Invalid login' });
  // Local demo login: plaintext seeded passwords work; hashed legacy users can use owner123 locally until real auth is added.
  const ok = user.password === password || (String(user.password).startsWith('$2') && password === 'owner123');
  if (!ok) return res.status(401).json({ error: 'Invalid login' });
  const safe = { user_id: user.user_id, username: user.username, email: user.email, role: user.role };
  const properties = rows('SELECT property_id, property_name, total_acre, address_1, address_2, pincode FROM property WHERE user_id = ? ORDER BY property_name', [user.user_id]);
  res.json({ user: safe, properties });
}));

app.get('/api/owner/properties', asyncHandler((req, res) => {
  const { userId } = q(req); requireOwner(userId);
  res.json(rows('SELECT property_id, property_name, total_acre, address_1, address_2, pincode FROM property WHERE user_id = ? ORDER BY property_name', [userId]));
}));

app.post('/api/owner/properties', asyncHandler((req, res) => {
  const { userId } = q(req); const owner = requireOwner(userId);
  const v = z.object({ property_name: z.string().min(2), total_acre: z.coerce.number().optional().default(0), address_1: z.string().optional().default(''), address_2: z.string().optional().default(''), pincode: z.string().optional().default('') }).parse(req.body);
  const result = insert('property', { ...v, user_id: userId, created_by: owner.username });
  res.status(201).json(row('SELECT property_id, property_name, total_acre, address_1, address_2, pincode FROM property WHERE property_id = ?', [result.lastInsertRowid]));
}));

app.get('/api/meta', asyncHandler((req, res) => {
  const { userId, propertyId } = q(req); if (userId) requireOwner(userId); if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  const propertyFilter = propertyId ? 'WHERE property_id = @propertyId' : '';
  res.json({
    properties: userId ? rows('SELECT property_id, property_name, total_acre, address_1, address_2, pincode FROM property WHERE user_id = @userId ORDER BY property_name', { userId }) : rows('SELECT property_id, property_name, total_acre, address_1, address_2, pincode FROM property ORDER BY property_name'),
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

app.get('/api/dashboard', asyncHandler((req, res) => {
  const { userId, propertyId } = q(req); if (userId) requireOwner(userId); if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  const params = { ...dateRange(req), propertyId };
  const pWhere = propertyId ? 'AND property_id = @propertyId' : '';
  const attendance = row(`SELECT COUNT(*) entries, COALESCE(SUM(attendance_value),0) labor_days FROM attendance WHERE date(entry_date) BETWEEN date(@from) AND date(@to) ${pWhere}`, params);
  const laborCost = row(`SELECT ${money('SUM(a.attendance_value * COALESCE(w.wage_fixed + w.wage_variable,0))')} total FROM attendance a JOIN labors l ON l.labor_id = a.labor_id LEFT JOIN wage w ON w.labor_id = l.labor_id WHERE date(a.entry_date) BETWEEN date(@from) AND date(@to) ${propertyId ? 'AND a.property_id = @propertyId' : ''}`, params);
  const rainfall = row(`SELECT COALESCE(SUM(r.rain_amount),0) total, COUNT(*) entries FROM raindetails r LEFT JOIN blocks b ON b.block_id = r.block_id WHERE date(r.date_time) BETWEEN date(@from) AND date(@to) ${propertyId ? 'AND b.property_id = @propertyId' : ''}`, params);
  const yieldTotal = row(`SELECT COALESCE(SUM(ys.yield_quantity),0) quantity, COUNT(*) entries, ${money('SUM(ys.yield_quantity * COALESCE(yr.yieldrate_running_rate,0))')} value FROM yield_settlement ys LEFT JOIN yieldrate yr ON yr.yieldrate_id = ys.yieldrate_id LEFT JOIN plantdetails pd ON pd.plant_id = yr.plant_id LEFT JOIN blocks b ON b.block_id = pd.block_id WHERE date(ys.yield_settlement_date) BETWEEN date(@from) AND date(@to) ${propertyId ? 'AND b.property_id = @propertyId' : ''}`, params);
  const expenses = row(`SELECT ${money('SUM(other_expense)')} total, COUNT(*) entries FROM running_expenses WHERE date(expense_occurence_date) BETWEEN date(@from) AND date(@to) ${pWhere}`, params);
  const income = row(`SELECT ${money('SUM(ci.income_amount)')} total, COUNT(*) entries FROM crop_income ci LEFT JOIN cropdetails cd ON cd.crop_id = ci.crop_id WHERE date(ci.received_date) BETWEEN date(@from) AND date(@to) ${propertyId ? 'AND cd.property_id = @propertyId' : ''}`, params);
  const assets = row(`SELECT ${money('SUM(asset_price)')} value, COUNT(*) entries FROM currentasset WHERE isactive = 1 ${pWhere}`, params);
  const profit = Number(income.total || 0) + Number(yieldTotal.value || 0) - Number(expenses.total || 0) - Number(laborCost.total || 0);
  const recentAttendance = rows(`SELECT a.attendance_id, date(a.entry_date) entry_date, l.name AS labor_name, p.property_name, a.attendance_value, COALESCE(w.wage_fixed + w.wage_variable, 0) AS wage, ROUND(a.attendance_value * COALESCE(w.wage_fixed + w.wage_variable,0), 2) cost FROM attendance a JOIN labors l ON l.labor_id = a.labor_id LEFT JOIN wage w ON w.labor_id = l.labor_id JOIN property p ON p.property_id = a.property_id WHERE 1=1 ${propertyId ? 'AND a.property_id = @propertyId' : ''} ORDER BY a.entry_date DESC, a.attendance_id DESC LIMIT 8`, params);
  const rainByBlock = rows(`SELECT p.property_name, b.block_name, COALESCE(SUM(r.rain_amount),0) total_rain FROM raindetails r LEFT JOIN blocks b ON b.block_id = r.block_id LEFT JOIN property p ON p.property_id = b.property_id WHERE date(r.date_time) BETWEEN date(@from) AND date(@to) ${propertyId ? 'AND b.property_id = @propertyId' : ''} GROUP BY p.property_name, b.block_name ORDER BY total_rain DESC`, params);
  const propertyProfit = rows(`SELECT p.property_name, ${money('SUM(COALESCE(ci.income_amount,0))')} income, ${money('SUM(COALESCE(re.other_expense,0))')} expense FROM property p LEFT JOIN cropdetails cd ON cd.property_id = p.property_id LEFT JOIN crop_income ci ON ci.crop_id = cd.crop_id LEFT JOIN running_expenses re ON re.property_id = p.property_id WHERE 1=1 ${propertyId ? 'AND p.property_id = @propertyId' : userId ? 'AND p.user_id = @userId' : ''} GROUP BY p.property_id ORDER BY p.property_name`, { ...params, userId });
  res.json({ attendance, laborCost, rainfall, yieldTotal, expenses, income, assets, profit, recentAttendance, rainByBlock, propertyProfit });
}));

app.get('/api/attendance', asyncHandler((req, res) => {
  const { propertyId } = q(req); const params = { ...dateRange(req), propertyId };
  res.json(rows(`SELECT a.attendance_id, date(a.entry_date) entry_date, a.attendance_value, l.name AS labor_name, COALESCE(w.wage_fixed + w.wage_variable, 0) AS wage, p.property_name, u.username AS user_name, ROUND(a.attendance_value * COALESCE(w.wage_fixed + w.wage_variable,0), 2) labor_cost FROM attendance a JOIN labors l ON l.labor_id = a.labor_id LEFT JOIN wage w ON w.labor_id = l.labor_id JOIN property p ON p.property_id = a.property_id JOIN users u ON u.user_id = a.user_id WHERE date(a.entry_date) BETWEEN date(@from) AND date(@to) ${propertyId ? 'AND a.property_id = @propertyId' : ''} ORDER BY a.entry_date DESC, a.attendance_id DESC`, params));
}));
const attendanceSchema = z.object({ labor_id: z.coerce.number().int().positive(), property_id: z.coerce.number().int().positive(), user_id: z.coerce.number().int().positive(), entry_date: z.string().min(10), attendance_value: z.coerce.number().min(0).max(1.5), created_by: z.string().max(100).default('Admin') });
app.post('/api/attendance', asyncHandler((req, res) => { const { userId, propertyId } = q(req); if (userId) assertPropertyAccess(userId, Number(req.body.property_id || propertyId)); const v = attendanceSchema.parse({ ...req.body, property_id: req.body.property_id || propertyId, user_id: req.body.user_id || userId || 1 }); const result = run(`INSERT INTO attendance (labor_id, property_id, user_id, entry_date, created_by, attendance_value) VALUES (@labor_id, @property_id, @user_id, @entry_date, @created_by, @attendance_value)`, v); res.status(201).json(row('SELECT * FROM attendance WHERE attendance_id = ?', [result.lastInsertRowid])); }));

app.get('/api/rainfall', asyncHandler((req, res) => { const { propertyId } = q(req); res.json(rows(`SELECT r.rain_id, date(r.date_time) recorded_date, r.rain_amount AS rain_value, 'mm' AS baseunit_name, p.property_name, b.block_name FROM raindetails r LEFT JOIN blocks b ON b.block_id = r.block_id LEFT JOIN property p ON p.property_id = b.property_id WHERE 1=1 ${propertyId ? 'AND b.property_id = @propertyId' : ''} ORDER BY r.date_time DESC, r.rain_id DESC`, { propertyId })); }));
const rainSchema = z.object({ block_id: z.coerce.number().int().positive(), rain_value: z.coerce.number().min(0), recorded_date: z.string().min(10), created_by: z.string().default('Admin') });
app.post('/api/rainfall', asyncHandler((req, res) => { const { userId, propertyId } = q(req); if (userId && propertyId) { const b = row('SELECT block_id FROM blocks WHERE block_id = ? AND property_id = ?', [req.body.block_id, propertyId]); if (!b) throw new Error('Block does not belong to selected property'); } const v = rainSchema.parse(req.body); const result = run(`INSERT INTO raindetails (block_id, rain_amount, date_time, created_by, created_on) VALUES (@block_id, @rain_value, @recorded_date, @created_by, CURRENT_TIMESTAMP)`, v); res.status(201).json(row('SELECT * FROM raindetails WHERE rain_id = ?', [result.lastInsertRowid])); }));

app.get('/api/yield', asyncHandler((req, res) => { const { propertyId } = q(req); res.json(rows(`SELECT ys.yield_settlement_id AS yieldsettlement_id, date(ys.yield_settlement_date) picking_date, ys.yield_quantity AS quantity, yr.yieldrate_running_rate AS rate, yt.yieldtype_name, bu.baseunit_name, pd.plant_type AS plant_name, p.property_name, ROUND(ys.yield_quantity * COALESCE(yr.yieldrate_running_rate,0), 2) estimated_value FROM yield_settlement ys LEFT JOIN yieldrate yr ON yr.yieldrate_id = ys.yieldrate_id LEFT JOIN yieldtype yt ON yt.yieldtype_id = yr.yieldtype_id LEFT JOIN plantdetails pd ON pd.plant_id = yr.plant_id LEFT JOIN blocks b ON b.block_id = pd.block_id LEFT JOIN property p ON p.property_id = b.property_id LEFT JOIN baseunit bu ON bu.baseunit_id = yr.baseunit_id WHERE 1=1 ${propertyId ? 'AND b.property_id = @propertyId' : ''} ORDER BY ys.yield_settlement_date DESC, ys.yield_settlement_id DESC`, { propertyId })); }));
const yieldSchema = z.object({ yieldrate_id: z.coerce.number().int().positive(), quantity: z.coerce.number().min(0), picking_date: z.string().min(10), created_by: z.string().default('Admin') });
app.post('/api/yield', asyncHandler((req, res) => { const { propertyId } = q(req); if (propertyId) { const y = row('SELECT yr.yieldrate_id FROM yieldrate yr JOIN plantdetails pd ON pd.plant_id = yr.plant_id JOIN blocks b ON b.block_id = pd.block_id WHERE yr.yieldrate_id = ? AND b.property_id = ?', [req.body.yieldrate_id, propertyId]); if (!y) throw new Error('Yield rate does not belong to selected property'); } const v = yieldSchema.parse(req.body); const result = run(`INSERT INTO yield_settlement (yieldrate_id, yield_quantity, yield_settlement_date, created_by) VALUES (@yieldrate_id, @quantity, @picking_date, @created_by)`, v); res.status(201).json(row('SELECT * FROM yield_settlement WHERE yield_settlement_id = ?', [result.lastInsertRowid])); }));

app.get('/api/:resource', asyncHandler((req, res) => {
  const cfg = endpoints[req.params.resource]; if (!cfg) return res.status(404).json({ error: 'Unknown resource' });
  const { userId, propertyId } = q(req); if (userId) requireOwner(userId); if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  res.json(scopedSelect(req.params.resource, cfg, userId, propertyId));
}));
app.post('/api/:resource', asyncHandler((req, res) => {
  const cfg = endpoints[req.params.resource]; if (!cfg) return res.status(404).json({ error: 'Unknown resource' });
  const { userId, propertyId } = q(req); if (userId) requireOwner(userId); if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  let payload = { ...pick(req.body, cfg.allowed), created_by: req.body.created_by || 'Admin' };
  if (req.params.resource === 'properties') payload.user_id = userId || payload.user_id;
  payload = applyProperty(req.params.resource, payload, propertyId);
  const result = insert(cfg.table, payload);
  res.status(201).json(row(`SELECT * FROM ${cfg.table} WHERE ${cfg.id} = ?`, [result.lastInsertRowid]));
}));
app.patch('/api/:resource/:id', asyncHandler((req, res) => { const cfg = endpoints[req.params.resource]; if (!cfg) return res.status(404).json({ error: 'Unknown resource' }); update(cfg.table, cfg.id, req.params.id, pick(req.body, cfg.allowed)); res.json(row(`SELECT * FROM ${cfg.table} WHERE ${cfg.id} = ?`, [req.params.id])); }));
app.delete('/api/:resource/:id', asyncHandler((req, res) => { const cfg = endpoints[req.params.resource]; if (!cfg) return res.status(404).json({ error: 'Unknown resource' }); run(`DELETE FROM ${cfg.table} WHERE ${cfg.id} = ?`, [req.params.id]); res.status(204).end(); }));

app.use((err, _req, res, _next) => { if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors }); console.error(err); res.status(500).json({ error: err.message || 'Internal server error' }); });
app.listen(PORT, () => console.log(`Coffee Estate API running on http://localhost:${PORT}`));
