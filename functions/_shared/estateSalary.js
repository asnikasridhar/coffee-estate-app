import { all, first } from './http.js';
import { calculateDay, payrollWrite } from './payroll.js';
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), {
    status
  });
};
export const money = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const today = () => new Date().toLocaleDateString('en-CA', {
  timeZone: 'Asia/Kolkata'
});
const components = ['fixed_earned', 'work_earned', 'variable_earned', 'overtime_earned', 'custom_earned'];
function date(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '') || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v) fail('Select a valid date');
  return v;
}
function amount(v, label, optional = false) {
  if (optional && (v == null || (typeof v === 'string' && v.trim() === ''))) return null;
  if (v == null || (typeof v === 'string' && v.trim() === '') || !Number.isFinite(Number(v)) || Number(v) < 0) fail(`${label} must be a non-negative number`);
  return money(v);
}
function quantity(v, label) {
  amount(v, label);
  return Number(v);
}
const decode = r => ({
  ...r,
  payload: JSON.parse(r.payload_json)
});
const active = (r, day) => r.effective_from <= day && r.effective_to >= day;
const pick = (versions, category, day) => versions.find(r => r.category === category && active(r, day));
async function person(env, p, id) {
  const row = await first(env, 'SELECT l.* FROM labors l JOIN property p ON p.user_id=l.user_id WHERE p.property_id=? AND l.labor_id=?', p, Number(id));
  if (!row) fail('Labour does not belong to this estate owner');
  return row;
}
async function unlocked(env, p, id, day) {
  if (await first(env, `SELECT 1 FROM estate_salary_payment WHERE property_id=? AND labor_id=? AND work_date=? UNION ALL SELECT 1 FROM finance_wage_period WHERE property_id=? AND labor_id=? AND period_start<=? AND period_end>=? AND status IN ('paid','finalized')`, p, id, day, p, id, day, day)) fail('This salary is paid; its snapshot cannot be changed', 409);
}
export async function estateRates(env, p) {
  return {
    exceptions: await all(env, 'SELECT e.*,l.name labor_name FROM labour_rate_exception e JOIN labors l ON l.labor_id=e.labor_id WHERE e.property_id=? ORDER BY e.effective_from DESC,e.exception_id DESC', p),
    labours: await all(env, 'SELECT l.labor_id,l.name FROM labors l JOIN property p ON p.user_id=l.user_id WHERE p.property_id=? ORDER BY l.name', p),
    versions: (await all(env, 'SELECT * FROM estate_rate_version WHERE property_id=? ORDER BY effective_from DESC,rate_version_id DESC', p)).map(decode),
    activities: await all(env, 'SELECT work_activity_id,work_activity_name FROM work_activity WHERE property_id=? ORDER BY work_activity_name', p),
    overtimeTypes: await all(env, 'SELECT * FROM estate_overtime_type WHERE property_id=? ORDER BY name', p),
    units: await all(env, 'SELECT baseunit_id,baseunit_name FROM baseunit ORDER BY baseunit_name'),
    crops: await all(env, 'SELECT crop_id,crop_name FROM crop_master WHERE property_id=? ORDER BY crop_name', p)
  };
}
// One component resolver for salary, exception context and assignment estimates.
export function resolveRate({
  versions,
  exceptions = [],
  propertyId,
  laborId,
  day,
  category,
  typeId = 0,
  wageKey = 'full_day',
  useRegular = false
}) {
  const version = pick(versions, category, day);
  const exception = exceptions.find(e => Number(e.property_id) === Number(propertyId) && Number(e.labor_id) === Number(laborId) && e.category === category && Number(e.type_id) === Number(typeId) && active(e, day));
  if (exception) return {
    value: category === 'daily' ? exception[wageKey] : exception.rate,
    unit: exception.unit,
    source: 'Custom Labour Rate',
    exception,
    version: version || null,
    rate: version?.payload.rates?.find(r => Number(r[category === 'work' ? 'work_activity_id' : 'overtime_type_id']) === Number(typeId))
  };
  if (category === 'daily') {
    const seasonal = useRegular ? null : pick(versions, 'seasonal', day);
    if (seasonal?.payload[wageKey] != null) return {
      value: seasonal.payload[wageKey],
      source: 'Seasonal Rate',
      exception: null,
      version: seasonal
    };
    return {
      value: version?.payload[wageKey],
      source: 'Estate Rate',
      exception: null,
      version: version || null
    };
  }
  const key = category === 'work' ? 'work_activity_id' : 'overtime_type_id';
  const rate = version?.payload.rates.find(r => Number(r[key]) === Number(typeId));
  return {
    value: rate?.rate,
    unit: rate?.unit,
    source: 'Estate Rate',
    exception: null,
    version: version || null,
    rate
  };
}
export async function rateContext(env, p, b) {
  const day = date(b.date),
    setup = await estateRates(env, p),
    category = b.category;
  if (!['daily', 'work', 'overtime'].includes(category)) fail('Invalid rate category');
  const args = {
    versions: setup.versions,
    propertyId: p,
    day,
    category,
    typeId: Number(b.type_id || 0),
    useRegular: true
  };
  if (category === 'daily') return {
    full_day: resolveRate({
      ...args,
      wageKey: 'full_day'
    }).value ?? null,
    half_day: resolveRate({
      ...args,
      wageKey: 'half_day'
    }).value ?? null
  };
  const resolved = resolveRate(args);
  return {
    rate: resolved.value ?? null,
    unit: resolved.unit || null
  };
}
export function rateAlerts(versions, day) {
  const result = [];
  for (const category of ['daily', 'work', 'overtime']) {
    const r = pick(versions, category, day);
    if (!r) result.push(`No active ${category} rate for ${day}.`);else if ((Date.parse(r.effective_to) - Date.parse(day)) / 86400000 <= 14) result.push(`${category} rates expire on ${r.effective_to}.`);
    const expired = versions.filter(v => v.category === category && v.effective_to < day).sort((a, b) => b.effective_to.localeCompare(a.effective_to))[0];
    if (!r && expired) result.push(`${category} rates expired on ${expired.effective_to}.`);
  }
  for (const r of versions.filter(v => v.category === 'seasonal')) {
    if (active(r, day)) result.push(`${r.payload.name} rates are active for this date.`);else if (r.effective_from > day && (Date.parse(r.effective_from) - Date.parse(day)) / 86400000 <= 30) result.push(`${r.payload.name} rates start on ${r.effective_from}.`);
  }
  return result;
}

// Pure calculation used by previews, payments and work estimates. Paid reports never call this.
export function calculateEstateDay({
  day,
  attendance,
  versions,
  assignments = [],
  input = {},
  overrides = [],
  exceptions = [],
  propertyId,
  laborId
}) {
  const fraction = Number(attendance);
  if (![0.5, 1].includes(fraction)) fail('Mark full-day or half-day attendance first');
  const daily = pick(versions, 'daily', day),
    work = pick(versions, 'work', day),
    ot = pick(versions, 'overtime', day);
  const season = pick(versions, 'seasonal', day);
  const wageKey = fraction === 0.5 ? 'half_day' : 'full_day';
  const dailyResolved = resolveRate({
    versions,
    exceptions,
    propertyId,
    laborId,
    day,
    category: 'daily',
    wageKey,
    useRegular: input.use_regular
  });
  const wage = dailyResolved.value;
  if (wage == null) fail(`No active daily wage rate for ${day}`);
  const workCharges = assignments.map(a => {
    const resolved = resolveRate({
      versions,
      exceptions,
      propertyId,
      laborId,
      day,
      category: 'work',
      typeId: a.work_activity_id
    });
    const r = resolved.value == null && a.rate_override == null ? null : {
      rate: a.rate_override ?? resolved.value,
      unit: resolved.unit || a.actual_unit
    };
    if (!r) fail(`No active ${a.work_activity_name} rate found for ${day}`);
    if (!['work', 'day'].includes(r.unit) && (a.work_quantity == null || a.work_unit !== r.unit)) fail(`Record ${r.unit} quantity for ${a.work_activity_name} in Work Assignment`);
    const units = r.unit === 'work' ? (a.completed_quantity == null ? 1 : Number(a.completed_quantity > 0)) : r.unit === 'day' ? fraction * (a.completed_quantity == null ? 1 : Number(a.completed_quantity > 0)) : quantity(a.work_quantity, 'Work quantity');
    return {
      work_assignment_id: a.work_assignment_id,
      work_activity_id: a.work_activity_id,
      work_activity_name: a.work_activity_name,
      block_id: a.block_id,
      block_name: a.block_name || 'Unallocated',
      unit: r.unit,
      quantity: units,
      rate: r.rate,
      amount: money(units * r.rate),
      rate_version_id: resolved.version?.rate_version_id || null,
      rate_source: a.rate_override != null ? 'Settlement Override' : resolved.source,
      completion: a.completion || null,
      exception_id: resolved.exception?.exception_id || null,
      exception_snapshot: resolved.exception
    };
  });
  const extras = (input.extras || []).map(e => {
    const resolved = resolveRate({
      versions,
      exceptions,
      propertyId,
      laborId,
      day,
      category: 'overtime',
      typeId: e.overtime_type_id
    });
    const r = resolved.value == null ? null : {
      ...resolved.rate,
      overtime_type_id: e.overtime_type_id,
      rate: resolved.value,
      unit: resolved.unit
    };
    const units = quantity(e.quantity, 'Extra quantity');
    if (!r) fail(`No active overtime/extra rate for ${day}`);
    if (r.unit === 'hour' && units > 24) fail('Overtime hours cannot exceed 24');
    return {
      ...r,
      quantity: units,
      amount: money(units * r.rate),
      rate_version_id: resolved.version?.rate_version_id || null,
      rate_source: resolved.source,
      exception_id: resolved.exception?.exception_id || null,
      exception_snapshot: resolved.exception
    };
  });
  const harvest = quantity(input.quantity ?? 0, 'Harvest quantity');
  let bonus = 0;
  if (season?.payload.bonus_amount && harvest) {
    if (String(input.unit_id) !== String(season.payload.unit_id)) fail('Harvest unit differs from the seasonal bonus unit');
    if (harvest >= season.payload.minimum_quantity) bonus = season.payload.bonus_amount;
  }
  const result = {
    work_date: day,
    attendance: fraction,
    fixed_earned: money(wage),
    daily_rate_source: dailyResolved.source,
    daily_exception: dailyResolved.exception,
    work_earned: money(workCharges.reduce((n, w) => n + w.amount, 0)),
    variable_earned: bonus,
    overtime_earned: money(extras.reduce((n, e) => n + e.amount, 0)),
    custom_earned: amount(input.custom_amount ?? 0, 'Custom extra'),
    work_charges: workCharges,
    extras,
    quantity: harvest,
    unit_id: input.unit_id || null,
    notes: input.notes || '',
    use_regular: !!input.use_regular,
    seasonal_name: season?.payload.name || null,
    rate_snapshot: {
      daily: daily || null,
      work: work || null,
      seasonal: season || null,
      overtime: ot || null,
      labour_exceptions: exceptions.filter(e => Number(e.property_id) === Number(propertyId) && Number(e.labor_id) === Number(laborId) && active(e, day))
    },
    messages: season ? [`${season.payload.name} rates are active for this date.`, ...(dailyResolved.source === 'Custom Labour Rate' ? [`Custom labour wage ${money(wage)} takes priority over the seasonal daily wage. The seasonal harvest bonus still applies.`] : []), ...(input.use_regular ? ['Regular wage explicitly selected for this day; seasonal harvest bonuses still apply.'] : []), ...(dailyResolved.source === 'Seasonal Rate' ? [`Seasonal daily wage ${money(wage)} is being used instead of regular ${daily?.payload[wageKey] ?? 'unconfigured'}.`] : [])] : [],
    original_components: {},
    overrides
  };
  for (const key of components) {
    result.original_components[key] = result[key];
    const change = overrides.find(o => o.component === key);
    if (change) result[key] = amount(change.override_amount, 'Override');
  }
  result.total_earned = money(components.reduce((n, key) => n + result[key], 0));
  return result;
}
async function advancesFor(env, p, id, day) {
  return all(env, `SELECT a.*,ar.reason,ROUND(a.amount-COALESCE((SELECT SUM(amount) FROM payroll_advance_recovery WHERE advance_id=a.advance_id),0)-COALESCE((SELECT SUM(amount) FROM estate_advance_recovery WHERE advance_id=a.advance_id),0),2) remaining FROM payroll_advance a LEFT JOIN payroll_advance_reason ar ON ar.advance_id=a.advance_id WHERE a.property_id=? AND a.labor_id=? AND a.paid_date<=? ORDER BY a.paid_date,a.advance_id`, p, id, day);
}
async function legacyPaid(env, p, id, day) {
  const row = await first(env, `SELECT w.*,s.breakdown_json FROM finance_wage_period w LEFT JOIN payroll_settlement s ON s.wage_period_id=w.wage_period_id WHERE w.property_id=? AND w.labor_id=? AND w.period_start<=? AND w.period_end>=? AND w.status IN ('paid','finalized')`, p, id, day, day);
  if (!row) return null;
  const snapshot = row.breakdown_json ? JSON.parse(row.breakdown_json) : null;
  const savedDay = snapshot?.days?.find(d => d.work_date === day);
  return {
    ...(savedDay || {}),
    labor_id: id,
    work_date: day,
    status: row.status === 'paid' ? 'paid' : 'partially paid',
    legacy: true,
    period_start: row.period_start,
    period_end: row.period_end,
    total_earned: savedDay?.total_earned ?? null,
    settled_paid: null,
    messages: ['Included in a legacy period settlement. Payment and advance totals are available in period history.'],
    snapshot
  };
}
export async function estatePreview(env, p, id, day, versions, completionContext) {
  date(day);
  const labor = await person(env, p, id);
  const paid = await first(env, 'SELECT * FROM estate_salary_payment WHERE property_id=? AND labor_id=? AND work_date=?', p, Number(id), day);
  if (paid) return {
    ...JSON.parse(paid.snapshot_json),
    status: 'paid',
    payment_id: paid.payment_id,
    payment_date: paid.payment_date,
    payment_method: paid.payment_method
  };
  const previous = await legacyPaid(env, p, Number(id), day);
  if (previous) return {
    ...previous,
    labor_name: labor.name
  };
  const records = await all(env, 'SELECT attendance_value FROM attendance WHERE property_id=? AND labor_id=? AND date(entry_date)=?', p, Number(id), day);
  if (records.length !== 1) fail(records.length ? 'Duplicate attendance; correct Attendance first' : 'Attendance is missing');
  const inputRow = await first(env, 'SELECT * FROM estate_salary_input WHERE property_id=? AND labor_id=? AND work_date=?', p, Number(id), day);
  const oldEntry = await first(env, 'SELECT d.*,COALESCE(e.custom_amount,0) custom_amount FROM payroll_daily d LEFT JOIN payroll_daily_extra e ON e.payroll_daily_id=d.payroll_daily_id WHERE property_id=? AND labor_id=? AND work_date=?', p, Number(id), day);
  let input = inputRow ? JSON.parse(inputRow.input_json) : {
    quantity: oldEntry?.quantity || 0,
    unit_id: oldEntry?.unit_id,
    custom_amount: oldEntry?.custom_amount || 0,
    notes: oldEntry?.notes || '',
    extras: []
  };
  const completionSetup = completionContext?.setup || await estateRates(env,p);
  const actualRows = (completionContext?.rows || await completionRows(env,p,day,completionSetup)).filter(a=>a.labor_id===Number(id));
  const missing = actualRows.find(a=>a.actual_quantity===null);
  if(missing)fail(`Work completion pending: ${missing.work_activity_name}`);
  const assignments = actualRows.map(a=>({...a,work_quantity:a.actual_quantity,work_unit:normalUnit(a.actual_unit),
    completed_quantity:a.actual_quantity,completion:{actual_quantity:a.actual_quantity,unit:a.actual_unit,revision:a.revision,rate_override:a.rate_override,reason:a.reason,notes:a.completion_notes}}));
  const harvestRows=actualRows.filter(a=>a.is_harvest);
  const activeSeason=pick(completionSetup.versions,'seasonal',day);
  if(harvestRows.length) {
    if(activeSeason?.payload.bonus_amount && harvestRows.some(a=>a.actual_quantity>0 && normalUnit(a.unit)!==normalUnit(activeSeason.payload.unit_name)))fail('Harvest completion unit differs from the seasonal bonus unit. Check Set Rates.');
    input={...input,quantity:harvestRows.reduce((n,a)=>n+a.actual_quantity,0),unit_id:activeSeason?.payload.unit_id || null};
  }

  const audit = await all(env, 'SELECT * FROM estate_salary_override WHERE property_id=? AND labor_id=? AND work_date=? ORDER BY override_id DESC', p, Number(id), day);
  const overrides = audit.filter((o, i) => audit.findIndex(x => x.component === o.component) === i);
  const rates = versions || (await estateRates(env, p)).versions;
  const exceptions = await all(env, 'SELECT * FROM labour_rate_exception WHERE property_id=? AND labor_id=? ORDER BY effective_from DESC', p, Number(id));
  let result;
  const firstEstateDay = rates.filter(r => r.category === 'daily').map(r => r.effective_from).sort()[0];
  // Existing per-person rules remain usable only before the estate's first daily version.
  if ((!firstEstateDay || day < firstEstateDay) && !exceptions.some(e => active(e, day))) {
    const rule = await first(env, `SELECT r.*,d.included_quantity,d.prorate_allowance,o.work_rates_json,o.bonus_quantity,o.bonus_mode,u.baseunit_name FROM finance_wage_rule r LEFT JOIN payroll_rule_detail d ON d.wage_rule_id=r.wage_rule_id LEFT JOIN payroll_rule_options o ON o.wage_rule_id=r.wage_rule_id LEFT JOIN baseunit u ON u.baseunit_id=r.variable_unit_id WHERE r.property_id=? AND r.labor_id=? AND r.effective_from<=? AND (r.effective_to IS NULL OR r.effective_to>=?) AND r.status='active' ORDER BY (r.season_id IS NOT NULL) DESC,r.effective_from DESC,r.wage_rule_id DESC LIMIT 1`, p, Number(id), day, day);
    if (!rule) result = calculateEstateDay({
      day,
      attendance: records[0].attendance_value,
      versions: rates,
      exceptions,
      propertyId: p,
      laborId: Number(id),
      assignments,
      input,
      overrides
    });else {
      if (input.extras?.length) fail('Set estate daily wages before using typed overtime extras. Historical overtime remains in the legacy daily entry.');
      result = {
        ...calculateDay(records[0].attendance_value, {
          ...oldEntry,
          ...input
        }, rule, assignments),
        work_date: day,
        rate_snapshot: {
          legacy: rule
        },
        messages: ['Using the historical labour-specific rate.'],
        original_components: {},
        overrides
      };
      for (const key of components) {
        result.original_components[key] = result[key];
        const change = overrides.find(o => o.component === key);
        if (change) result[key] = change.override_amount;
      }
      result.total_earned = money(components.reduce((n, k) => n + result[k], 0));
    }
  } else {
    if (!inputRow && oldEntry?.overtime_hours) fail('Review existing overtime under the estate overtime types before payment');
    result = calculateEstateDay({
      day,
      attendance: records[0].attendance_value,
      versions: rates,
      exceptions,
      propertyId: p,
      laborId: Number(id),
      assignments,
      input,
      overrides
    });
  }
  const advances = await advancesFor(env, p, Number(id), day);
  const balance = money(advances.reduce((n, a) => n + a.remaining, 0));
  const defaultDeduction = Math.min(balance, result.total_earned);
  const override = overrides.find(o => o.component === 'advance_paid');
  const deduction = override ? override.override_amount : defaultDeduction;
  if (deduction > balance || deduction > result.total_earned) fail('Advance deduction exceeds available advances or earnings; review the override');
  let remaining = deduction;
  const recoveries = [];
  for (const a of advances) {
    const value = money(Math.min(remaining, a.remaining));
    if (value > 0) {
      recoveries.push({
        ...a,
        recovered: value
      });
      remaining = money(remaining - value);
    }
  }
  const property = await first(env, 'SELECT property_name FROM property WHERE property_id=?', p);
  const financeSeason = await first(env, "SELECT season_id FROM finance_season WHERE property_id=? AND start_date<=? AND end_date>=? AND status<>'archived' ORDER BY start_date DESC,season_id DESC LIMIT 1", p, day, day);
  const value = {
    ...result,
    season_id: financeSeason?.season_id || null,
    property_id: p,
    property_name: property?.property_name,
    labor_id: Number(id),
    labor_name: labor.name,
    status: 'unpaid',
    input,
    override_audit: audit,
    advance_balance: balance,
    original_advance_paid: defaultDeduction,
    advance_paid: deduction,
    settled_paid: money(result.total_earned - deduction),
    recoveries
  };
  value.preview_key = JSON.stringify(value);
  return value;
}
export async function estateDay(env, p, day) {
  date(day);
  const setup = await estateRates(env, p);
  const completionContext={setup,rows:await completionRows(env,p,day,setup)};
  const ids = await all(env, `SELECT DISTINCT labor_id FROM attendance WHERE property_id=? AND date(entry_date)=? AND attendance_value>0 UNION SELECT labor_id FROM estate_salary_payment WHERE property_id=? AND work_date=? UNION SELECT labor_id FROM finance_wage_period WHERE property_id=? AND period_start<=? AND period_end>=? AND status IN ('paid','finalized')`, p, day, p, day, p, day, day);
  const rows = [];
  for (const l of ids) {
    try {
      rows.push(await estatePreview(env, p, l.labor_id, day, setup.versions, completionContext));
    } catch (e) {
      const worker = await person(env, p, l.labor_id);
      const saved = await first(env, 'SELECT input_json FROM estate_salary_input WHERE property_id=? AND labor_id=? AND work_date=?', p, l.labor_id, day);
      const attendance = await first(env, 'SELECT attendance_value FROM attendance WHERE property_id=? AND labor_id=? AND date(entry_date)=?', p, l.labor_id, day);
      rows.push({
        labor_id: l.labor_id,
        labor_name: worker.name,
        work_date: day,
        attendance: attendance?.attendance_value,
        input: saved ? JSON.parse(saved.input_json) : {},
        status: 'pending',
        error: e.message
      });
    }
  }
  return {
    rows,
    alerts: rateAlerts(setup.versions, day),
    setup
  };
}
export async function estateWrite(env, p, action, b, who) {
  if (action === 'labour-exception') {
    const id = Number(b.labor_id);
    await person(env, p, id);
    const category = b.category,
      start = date(b.effective_from),
      end = date(b.effective_to);
    if (end < start) fail('To Date must be on or after From Date');
    if (!['daily', 'work', 'overtime'].includes(category)) fail('Only daily, work and overtime exceptions are supported');
    const type = category === 'daily' ? 0 : Number(b.type_id);
    let full = null,
      half = null,
      rate = null,
      unit = null;
    if (category === 'daily') {
      full = amount(b.full_day, 'Full day wage');
      half = amount(b.half_day, 'Half day wage');
    } else {
      const row = await first(env, category === 'work' ? 'SELECT work_activity_id FROM work_activity WHERE property_id=? AND work_activity_id=?' : 'SELECT unit FROM estate_overtime_type WHERE property_id=? AND overtime_type_id=?', p, type);
      if (!row) fail('Rate type does not belong to this estate');
      rate = amount(b.rate, 'Custom rate');
      unit = category === 'work' ? b.unit : row.unit;
      if (!['work', 'day', 'acre', 'tree', 'kg', 'bushel', 'hour', 'trip', 'quantity'].includes(unit)) fail('Select a valid unit');
    }
    const versions = (await estateRates(env, p)).versions;
    const relevant = versions.filter(v => v.category === category && v.effective_from <= end && v.effective_to >= start).sort((a, b) => a.effective_from.localeCompare(b.effective_from));
    let cursor = start,
      identical = true;
    for (const v of relevant) {
      if (v.effective_from > cursor) {
        identical = false;
        break;
      }
      const d = resolveRate({
        versions: [v],
        propertyId: p,
        day: cursor,
        category,
        typeId: type,
        useRegular: true
      });
      if (category === 'daily' ? v.payload.full_day !== full || v.payload.half_day !== half : d.value !== rate || d.unit !== unit) {
        identical = false;
        break;
      }
      cursor = new Date(Date.parse(v.effective_to) + 86400000).toISOString().slice(0, 10);
      if (cursor > end) break;
    }
    if (identical && cursor > end) fail('These values already match the estate defaults. No exception is needed.');
    try {
      const r = await env.DB.prepare('INSERT INTO labour_rate_exception(property_id,labor_id,category,type_id,full_day,half_day,rate,unit,effective_from,effective_to,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(p, id, category, type, full, half, rate, unit, start, end, String(b.notes || '').slice(0, 2000), who).run();
      return {
        id: r.meta.last_row_id
      };
    } catch (e) {
      if (/overlap/i.test(e.message)) fail('Exception dates overlap an existing version for this labour and rate type.', 409);
      throw e;
    }
  }
  if (action === 'rate-version') {
    const start = date(b.effective_from),
      end = date(b.effective_to),
      category = b.category;
    if (end < start) fail('To Date must be on or after From Date');
    const data = b.payload || {},
      payload = {};
    if (category === 'daily') {
      payload.full_day = amount(data.full_day, 'Full day wage');
      payload.half_day = amount(data.half_day, 'Half day wage');
    } else if (category === 'seasonal') {
      payload.name = String(data.name || '').trim();
      if (!payload.name) fail('Enter a season name');
      payload.full_day = amount(data.full_day, 'Full day wage', true);
      payload.half_day = amount(data.half_day, 'Half day wage', true);
      payload.minimum_quantity = quantity(data.minimum_quantity, 'Minimum quantity');
      payload.bonus_amount = amount(data.bonus_amount, 'Bonus amount');
      payload.unit_id = Number(data.unit_id);
      if (!(await first(env, 'SELECT 1 FROM baseunit WHERE baseunit_id=?', payload.unit_id))) fail('Select a bonus unit');
      if (payload.minimum_quantity <= 0) fail('Minimum quantity must be greater than zero');
      payload.unit_name = (await first(env, 'SELECT baseunit_name FROM baseunit WHERE baseunit_id=?', payload.unit_id)).baseunit_name;
      payload.crop_id = data.crop_id ? Number(data.crop_id) : null;
      if (payload.crop_id && !(await first(env, 'SELECT 1 FROM crop_master WHERE property_id=? AND crop_id=?', p, payload.crop_id))) fail('Invalid crop');
      payload.bonus_mode = 'threshold_once';
    } else if (['work', 'overtime'].includes(category)) {
      if (!Array.isArray(data.rates) || !data.rates.length || data.rates.length > 100) fail('Add between 1 and 100 rates');
      const seen = new Set();
      payload.rates = [];
      for (const item of data.rates) {
        const key = category === 'work' ? 'work_activity_id' : 'overtime_type_id',
          id = Number(item[key]);
        if (seen.has(id)) fail('Select each type only once');
        seen.add(id);
        const row = await first(env, category === 'work' ? 'SELECT work_activity_name name FROM work_activity WHERE property_id=? AND work_activity_id=?' : 'SELECT name,unit FROM estate_overtime_type WHERE property_id=? AND overtime_type_id=?', p, id);
        if (!row) fail('Type does not belong to this property');
        const unit = category === 'work' ? item.unit : row.unit;
        if (!['acre', 'tree', 'day', 'work', 'kg', 'bushel', 'hour', 'trip', 'quantity'].includes(unit)) fail('Invalid rate unit');
        payload.rates.push({
          [key]: id,
          name: row.name,
          unit,
          rate: amount(item.rate, 'Rate')
        });
      }
    } else fail('Invalid rate category');
    try {
      const r = await env.DB.prepare('INSERT INTO estate_rate_version(property_id,category,effective_from,effective_to,payload_json,created_by) VALUES(?,?,?,?,?,?)').bind(p, category, start, end, JSON.stringify(payload), who).run();
      return {
        id: r.meta.last_row_id
      };
    } catch (e) {
      if (/overlap/i.test(e.message)) fail('These dates overlap an existing rate version. Choose a new, non-overlapping range.', 409);
      throw e;
    }
  }
  if (action === 'overtime-type') {
    const name = String(b.name || '').trim(),
      unit = b.unit;
    if (!name || !['hour', 'trip', 'day', 'quantity'].includes(unit)) fail('Enter a name and select a unit');
    const r = await env.DB.prepare('INSERT INTO estate_overtime_type(property_id,name,unit) VALUES(?,?,?)').bind(p, name, unit).run();
    return {
      id: r.meta.last_row_id
    };
  }
  if (action === 'pay-selected') {
    const day = date(b.work_date);
    if (day > today()) fail('Future salary cannot be paid');
    const paidDate = date(b.payment_date || today());
    if (paidDate < day || paidDate > today()) fail('Payment date must be on or after work and not in the future');
    const method = b.payment_method || 'cash';
    if (!['cash', 'bank', 'upi'].includes(method)) fail('Invalid payment method');
    if (!Array.isArray(b.items) || !b.items.length || b.items.length > 100) fail('Select between 1 and 100 labourers');
    const unique = new Set(),
      statements = [];
    let total = 0;
    for (const item of b.items) {
      const id = Number(item.labor_id);
      if (unique.has(id)) fail('Labour selected twice');
      unique.add(id);
      const preview = await estatePreview(env, p, id, day);
      if (preview.status !== 'unpaid') fail('Salary already paid', 409);
      if (preview.preview_key !== item.preview_key) fail('Salary inputs changed. Refresh and review before payment.', 409);
      const snapshot = {
        ...preview,
        preview_key: undefined,
        status: 'paid',
        payment_date: paidDate,
        payment_method: method,
        paid_by: who
      };
      const lookup = 'SELECT payment_id FROM estate_salary_payment WHERE property_id=? AND labor_id=? AND work_date=?',
        args = [p, id, day];
      statements.push(env.DB.prepare('INSERT INTO estate_salary_payment(property_id,labor_id,work_date,payment_date,payment_method,earned,advances,payable,snapshot_json,paid_by,season_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(p, id, day, paidDate, method, preview.total_earned, preview.advance_paid, preview.settled_paid, JSON.stringify(snapshot), who, preview.season_id));
      for (const r of preview.recoveries) statements.push(env.DB.prepare(`INSERT INTO estate_advance_recovery(payment_id,advance_id,amount) VALUES((${lookup}),?,?)`).bind(...args, r.advance_id, r.recovered));
      statements.push(env.DB.prepare(`INSERT INTO running_expenses(expensetype_id,property_id,season_id,expense_code,expense_occurence_date,other_expense,description,payment_status,payment_method,source_type,source_id,status,created_by) VALUES((SELECT expensetype_id FROM expensetype WHERE expense_code='LABOUR' LIMIT 1),?,?,'Labour salary',?,?,?,'paid',?,'estate_salary',( ${lookup} ),'confirmed',?)`).bind(p, preview.season_id, day, preview.total_earned, `Salary: ${preview.labor_name}, ${day}`, method, ...args, who));
      total = money(total + preview.settled_paid);
    }
    try {
      await env.DB.batch(statements);
    } catch (e) {
      if (/UNIQUE|overlap|recovered/i.test(e.message)) fail('Salary or advances changed elsewhere. Refresh before paying.', 409);
      throw e;
    }
    return {
      paid: b.items.length,
      total
    };
  }
  const id = Number(b.labor_id),
    day = date(b.work_date);
  await person(env, p, id);
  await unlocked(env, p, id, day);
  if (action === 'settlement-input') {
    const harvest = quantity(b.quantity ?? 0, 'Harvest quantity'),
      custom = amount(b.custom_amount ?? 0, 'Custom extra');
    if (harvest && !(await first(env, 'SELECT 1 FROM baseunit WHERE baseunit_id=?', Number(b.unit_id)))) fail('Select harvest unit');
    const seasonRow = await first(env, "SELECT * FROM estate_rate_version WHERE property_id=? AND category='seasonal' AND effective_from<=? AND effective_to>=? ORDER BY effective_from DESC,rate_version_id DESC LIMIT 1", p, day, day);
    const season = seasonRow ? decode(seasonRow) : null;
    if (harvest && season?.payload.bonus_amount && String(b.unit_id) !== String(season.payload.unit_id)) {
      fail(`Select ${season.payload.unit_name} as the harvest unit for ${season.payload.name}`);
    }
    const extras = [];
    const seen = new Set();
    if (!Array.isArray(b.extras || []) || (b.extras || []).length > 50) fail('Invalid extra entries');
    for (const e of b.extras || []) {
      const type = Number(e.overtime_type_id);
      if (seen.has(type)) fail('Extra type entered twice');
      seen.add(type);
      if (!(await first(env, 'SELECT 1 FROM estate_overtime_type WHERE property_id=? AND overtime_type_id=?', p, type))) fail('Invalid overtime type');
      extras.push({
        overtime_type_id: type,
        quantity: quantity(e.quantity, 'Extra quantity')
      });
    }
    const input = {
      quantity: harvest,
      unit_id: b.unit_id ? Number(b.unit_id) : null,
      custom_amount: custom,
      extras,
      use_regular: b.use_regular === true,
      notes: String(b.notes || '')
    };
    await env.DB.prepare('INSERT INTO estate_salary_input(property_id,labor_id,work_date,input_json,modified_by) VALUES(?,?,?,?,?) ON CONFLICT(property_id,labor_id,work_date) DO UPDATE SET input_json=excluded.input_json,modified_by=excluded.modified_by,modified_on=CURRENT_TIMESTAMP').bind(p, id, day, JSON.stringify(input), who).run();
    return {
      ok: true
    };
  }
  if (action === 'settlement-override') {
    if (![...components, 'advance_paid'].includes(b.component)) fail('Invalid component');
    const preview = await estatePreview(env, p, id, day),
      value = amount(b.override_amount, 'Override amount'),
      reason = String(b.reason || '').trim();
    if (!reason) fail('An override reason is required');
    if (b.preview_key !== preview.preview_key) fail('Salary inputs changed. Refresh before overriding.', 409);
    const original = b.component === 'advance_paid' ? preview.original_advance_paid : preview.original_components[b.component];
    if (b.component === 'advance_paid' && (value > preview.total_earned || value > preview.advance_balance)) fail('Deduction exceeds available advances or earnings');
    const r = await env.DB.prepare('INSERT INTO estate_salary_override(property_id,labor_id,work_date,component,original_amount,override_amount,reason,created_by) VALUES(?,?,?,?,?,?,?,?)').bind(p, id, day, b.component, original, value, reason, who).run();
    return {
      id: r.meta.last_row_id
    };
  }
  if (action === 'settlement-advance') return payrollWrite(env, p, 'advance', {
    ...b,
    paid_date: b.paid_date || day
  }, who);
  fail('Unknown salary action');
}
export async function assignmentEstimate(env, p, b) {
  const day = date(b.date),
    setup = await estateRates(env, p);
  if (b.labor_id) await person(env, p, b.labor_id);
  const resolved = resolveRate({
    versions: setup.versions,
    exceptions: setup.exceptions,
    propertyId: p,
    laborId: b.labor_id,
    day,
    category: 'work',
    typeId: b.work_activity_id
  });
  const version = resolved.version,
    rate = resolved.value == null ? null : {
      ...resolved.rate,
      rate: resolved.value,
      unit: resolved.unit
    };
  if (!rate) return {
    message: `No active work rate found for ${day}`
  };
  const quantity = rate.unit === 'work' ? 1 : rate.unit === 'day' ? null : b.quantity !== '' && b.quantity != null && b.unit === rate.unit ? amount(b.quantity, 'Quantity') : null;
  const isHarvest=/harvest|pick(?:ing)?|pluck/i.test(setup.activities.find(a=>a.work_activity_id===Number(b.work_activity_id))?.work_activity_name || '');
  const seasonal=pick(setup.versions,'seasonal',day);
  const inputUnit=['work','day'].includes(rate.unit) ? (isHarvest && seasonal ? normalUnit(seasonal.payload.unit_name) : null) : rate.unit;
  return {
    ...rate,
    input_unit:inputUnit,
    rate_version_id: version?.rate_version_id || null,
    rate_source: resolved.source,
    exception_id: resolved.exception?.exception_id || null,
    estimated_amount: quantity == null ? null : money(quantity * rate.rate),
    message: rate.unit === 'day' ? 'Per-day work charge follows attendance.' : null
  };
}
export async function salaryReport(env, p, b) {
  const start = date(b.from),
    end = date(b.to);
  if (end < start || Date.parse(end) - Date.parse(start) > 366 * 86400000) fail('Select a report range up to one year');
  const paid = await all(env, 'SELECT * FROM estate_salary_payment WHERE property_id=? AND work_date BETWEEN ? AND ? ORDER BY work_date,labor_id', p, start, end);
  const rows = paid.map(r => ({
    ...JSON.parse(r.snapshot_json),
    status: 'paid',
    payment_id: r.payment_id
  }));
  const legacy = await all(env, `SELECT w.*,s.breakdown_json,l.name labor_name FROM finance_wage_period w LEFT JOIN payroll_settlement s ON s.wage_period_id=w.wage_period_id JOIN labors l ON l.labor_id=w.labor_id WHERE w.property_id=? AND w.period_end BETWEEN ? AND ? AND w.status IN ('paid','finalized') ORDER BY w.period_end`, p, start, end);
  for (const row of legacy) {
    const saved = row.breakdown_json ? JSON.parse(row.breakdown_json) : {};
    rows.push({
      ...row,
      ...saved,
      legacy: true,
      status: row.status === 'paid' ? 'paid' : 'partially paid',
      work_date: row.period_end
    });
  }
  // Unpaid records are explicitly provisional; final/paid figures come only from saved snapshots.
  const pending = await all(env, `SELECT DISTINCT labor_id,date(entry_date) work_date FROM attendance a WHERE property_id=? AND date(entry_date) BETWEEN ? AND ? AND attendance_value>0 AND NOT EXISTS(SELECT 1 FROM estate_salary_payment s WHERE s.property_id=a.property_id AND s.labor_id=a.labor_id AND s.work_date=date(a.entry_date)) AND NOT EXISTS(SELECT 1 FROM finance_wage_period w WHERE w.property_id=a.property_id AND w.labor_id=a.labor_id AND date(a.entry_date) BETWEEN w.period_start AND w.period_end AND w.status IN ('paid','finalized'))`, p, start, end);
  const versions = (await estateRates(env, p)).versions;
  for (const r of pending) {
    try {
      rows.push(await estatePreview(env, p, r.labor_id, r.work_date, versions));
    } catch (e) {
      const l = await person(env, p, r.labor_id);
      rows.push({
        ...r,
        labor_name: l.name,
        status: 'pending',
        error: e.message
      });
    }
  }
  const advances = await all(env, 'SELECT a.*,l.name labor_name FROM payroll_advance a JOIN labors l ON l.labor_id=a.labor_id WHERE a.property_id=? AND a.paid_date BETWEEN ? AND ? ORDER BY a.paid_date', p, start, end);
  const property = await first(env, 'SELECT property_name FROM property WHERE property_id=?', p);
  return {
    property: property?.property_name,
    from: start,
    to: end,
    rows,
    advances,
    note: 'Paid amounts use frozen snapshots. Unpaid amounts are provisional. Legacy period totals are included by period end date.'
  };
}

// Completion reuses assignment identity and resolves units/rates centrally.
async function completionRows(env, p, day, setup) {
  const rows = await all(env, `SELECT a.*,l.name labor_name,w.work_activity_name,b.block_name,
    c.actual_quantity,c.actual_unit,c.rate_override,c.reason,c.notes completion_notes,c.revision,
    json_array(a.work_assignment_id,a.property_id,a.labor_id,a.work_date,a.work_activity_id,a.block_id,a.work_quantity,a.work_unit) assignment_key
    FROM work_assignment a JOIN labors l ON l.labor_id=a.labor_id
    JOIN work_activity w ON w.work_activity_id=a.work_activity_id LEFT JOIN blocks b ON b.block_id=a.block_id
    LEFT JOIN work_completion c ON c.work_assignment_id=a.work_assignment_id
    WHERE a.property_id=? AND date(a.work_date)=? ORDER BY l.name,a.labor_id,a.work_assignment_id`, p, day);
  const seasonal = pick(setup.versions, 'seasonal', day);
  return rows.map(a => {
    const resolved = resolveRate({versions:setup.versions,exceptions:setup.exceptions,propertyId:p,laborId:a.labor_id,day,category:'work',typeId:a.work_activity_id});
    const isHarvest = /harvest|pick(?:ing)?|pluck/i.test(a.work_activity_name);
    const rateUnit = resolved.unit || a.work_unit || 'work';
    const harvestUnit = isHarvest && ['work','day'].includes(rateUnit) ? (a.work_unit || seasonal?.payload.unit_name) : null;
    const unit = a.actual_unit || harvestUnit || rateUnit;
    const fixed = ['work','day'].includes(unit);
    return {...a,unit,fixed,is_harvest:isHarvest,rate:resolved.value,rate_unit:rateUnit,rate_source:resolved.source,
      assigned_quantity: fixed ? 1 : (a.work_unit && normalUnit(a.work_unit)===normalUnit(unit) ? a.work_quantity : null),
      actual_quantity:a.actual_quantity ?? null,revision:a.revision || 0};
  });
}
const normalUnit = value => {
  const unit=String(value || '').trim().toLowerCase();
  return ({bushal:'bushel',bushals:'bushel',bushels:'bushel',kilogram:'kg',kilograms:'kg',acres:'acre',trees:'tree',hours:'hour'})[unit] || unit;
};
export async function workCompletionDay(env,p,day) {
  date(day);
  const setup=await estateRates(env,p), rows=await completionRows(env,p,day,setup);
  const inputs=await all(env,'SELECT labor_id,input_json FROM estate_salary_input WHERE property_id=? AND work_date=?',p,day);
  const attended=await all(env,'SELECT DISTINCT l.labor_id,l.name FROM attendance a JOIN labors l ON l.labor_id=a.labor_id WHERE a.property_id=? AND date(a.entry_date)=? AND a.attendance_value>0 ORDER BY l.name',p,day);
  const paidIds=await all(env,"SELECT labor_id FROM estate_salary_payment WHERE property_id=? AND work_date=? UNION SELECT labor_id FROM finance_wage_period WHERE property_id=? AND ? BETWEEN period_start AND period_end AND status IN ('paid','finalized')",p,day,p,day);
  const labours=[];
  for(const labor of setup.labours) {
    const assignments=rows.filter(a=>a.labor_id===labor.labor_id);
    const input=JSON.parse(inputs.find(i=>i.labor_id===labor.labor_id)?.input_json || '{}');
    if(!assignments.length && !input.extras?.length)continue;
    const paid=paidIds.some(r=>r.labor_id===labor.labor_id);
    labours.push({...labor,assignments,extras:input.extras || [],input_key:JSON.stringify(input),paid:!!paid,
      completed:!!paid || assignments.every(a=>a.actual_quantity!==null)});
  }
  return {date:day,labours,setup:{activities:setup.activities,overtimeTypes:setup.overtimeTypes,attended:attended.filter(l=>!paidIds.some(r=>r.labor_id===l.labor_id)).map(l=>({...l,input_key:JSON.stringify(JSON.parse(inputs.find(i=>i.labor_id===l.labor_id)?.input_json || '{}'))}))},
    summary:{labourers:labours.length,completed:labours.filter(l=>l.completed).length,pending:labours.filter(l=>!l.completed).length}};
}
export async function saveWorkCompletion(env,p,b,who) {
  const day=date(b.date),setup=await estateRates(env,p),rows=await completionRows(env,p,day,setup);
  if(!Array.isArray(b.items) || b.items.length>500)fail('Invalid completion list');
  const statements=[],seen=new Set();
  for(const item of b.items) {
    const a=rows.find(r=>r.work_assignment_id===Number(item.work_assignment_id));
    if(!a || seen.has(a.work_assignment_id))fail('Invalid or duplicate assignment');
    seen.add(a.work_assignment_id);
    await unlocked(env,p,a.labor_id,day);
    if(item.assignment_key!==a.assignment_key || Number(item.revision)!==a.revision)fail('Work completion changed elsewhere. Refresh before saving.',409);
    const actual=quantity(item.actual_quantity,'Actual quantity');
    if(a.fixed && ![0,1].includes(actual))fail('Confirm Done or Not done for fixed work');
    const override=amount(item.rate_override,'Override rate',true),reason=String(item.reason || '').trim();
    if(override!==null && !reason)fail('A reason is required for a different rate');
    statements.push(env.DB.prepare(`INSERT INTO work_completion(work_assignment_id,actual_quantity,actual_unit,rate_override,reason,notes,revision,assignment_key,modified_by)
      VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(work_assignment_id) DO UPDATE SET actual_quantity=excluded.actual_quantity,actual_unit=excluded.actual_unit,rate_override=excluded.rate_override,reason=excluded.reason,notes=excluded.notes,revision=excluded.revision,assignment_key=excluded.assignment_key,modified_by=excluded.modified_by,modified_on=CURRENT_TIMESTAMP`)
      .bind(a.work_assignment_id,actual,a.unit,override,reason,String(item.notes || ''),a.revision+1,a.assignment_key,who));
  }
  const extrasSeen=new Set();
  for(const entry of b.labour_extras || []) {
    const id=Number(entry.labor_id);
    if(extrasSeen.has(id))fail('Labour extras entered twice');
    extrasSeen.add(id);await person(env,p,id);await unlocked(env,p,id,day);
    if(!await first(env,'SELECT 1 FROM attendance WHERE property_id=? AND labor_id=? AND date(entry_date)=? AND attendance_value>0',p,id,day))fail('Record attendance before adding OT');
    const saved=await first(env,'SELECT input_json FROM estate_salary_input WHERE property_id=? AND labor_id=? AND work_date=?',p,id,day);
    const input=JSON.parse(saved?.input_json || '{}');
    if(entry.input_key!==JSON.stringify(input))fail('Extras changed elsewhere. Refresh before saving.',409);
    if(!Array.isArray(entry.extras) || entry.extras.length>50)fail('Invalid extras');
    const types=new Set();
    const extras=entry.extras.map(e=>{
      const type=setup.overtimeTypes.find(t=>t.overtime_type_id===Number(e.overtime_type_id));
      if(!type || types.has(type.overtime_type_id))fail('Invalid or duplicate OT type');
      types.add(type.overtime_type_id);
      const value=quantity(e.quantity,'Extra quantity');
      if(type.unit==='hour' && value>24)fail('Overtime hours cannot exceed 24');
      return {overtime_type_id:type.overtime_type_id,quantity:value};
    });
    statements.push(env.DB.prepare(`INSERT INTO estate_salary_input(property_id,labor_id,work_date,input_json,modified_by) VALUES(?,?,?,?,?) ON CONFLICT(property_id,labor_id,work_date) DO UPDATE SET input_json=excluded.input_json,modified_by=excluded.modified_by,modified_on=CURRENT_TIMESTAMP`).bind(p,id,day,JSON.stringify({...input,extras}),who));
  }
  if(statements.length)await env.DB.batch(statements);
  return {ok:true};
}
export async function addCompletionWork(env,p,b,who) {
  const day=date(b.date),id=Number(b.labor_id),type=Number(b.work_activity_id);
  await person(env,p,id);await unlocked(env,p,id,day);
  if(!await first(env,'SELECT 1 FROM attendance WHERE property_id=? AND labor_id=? AND date(entry_date)=? AND attendance_value>0',p,id,day))fail('Record attendance before adding work');
  if(!await first(env,'SELECT 1 FROM work_activity WHERE property_id=? AND work_activity_id=?',p,type))fail('Select work for this estate');
  if(await first(env,'SELECT 1 FROM work_assignment WHERE property_id=? AND labor_id=? AND date(work_date)=? AND work_activity_id=? AND block_id IS NULL',p,id,day,type))fail('This work is already listed for the labourer');
  const result=await env.DB.prepare('INSERT INTO work_assignment(property_id,labor_id,work_date,work_activity_id,notes) VALUES(?,?,?,?,?)').bind(p,id,day,type,'Extra work').run();
  return {work_assignment_id:result.meta.last_row_id};
}
