import { all, first } from './http.js';
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), {
    status
  });
};
const money = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const numeric = (v, label, max = Infinity) => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n) || n < 0 || n > max) fail(`${label} is invalid`);
  return n;
};
function date(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '') || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v) fail('Select a valid date');
  return v;
}
async function labour(env, p, id) {
  const l = await first(env, 'SELECT l.* FROM labors l JOIN property p ON p.user_id=l.user_id WHERE p.property_id=? AND l.labor_id=?', p, Number(id));
  if (!l) fail('Labour does not belong to this estate owner');
  return l;
}
const ruleQuery = `SELECT r.*,COALESCE(d.included_quantity,0) included_quantity,COALESCE(d.prorate_allowance,1) prorate_allowance,COALESCE(o.work_rates_json,'[]') work_rates_json,COALESCE(o.bonus_quantity,1) bonus_quantity,COALESCE(o.bonus_mode,'proportional') bonus_mode,u.baseunit_name FROM finance_wage_rule r LEFT JOIN payroll_rule_detail d ON d.wage_rule_id=r.wage_rule_id LEFT JOIN payroll_rule_options o ON o.wage_rule_id=r.wage_rule_id LEFT JOIN baseunit u ON u.baseunit_id=r.variable_unit_id`;
export function calculateDay(attendance, entry, rule, assignments = []) {
  const fraction = Number(attendance);
  if (![0, 0.5, 1].includes(fraction)) fail('Attendance must be absent, half day or full day; correct Attendance first');
  if (rule.fixed_basis !== 'day') fail('Configure a daily salary rate for this labour');
  const quantity = numeric(entry?.quantity, 'Harvest'),
    ot = numeric(entry?.overtime_hours, 'OT hours', 24);
  if (!fraction && (quantity || ot || Number(entry?.custom_amount))) fail('Harvest or OT has been entered on an absent day');
  if (quantity && String(entry.unit_id) !== String(rule.variable_unit_id)) fail('Harvest unit differs from the salary rate unit');
  const allowance = Number(rule.included_quantity || 0) * (Number(rule.prorate_allowance) !== 0 ? fraction : 1);
  const extra = Math.max(0, quantity - allowance);
  const fixed = money(Number(rule.fixed_rate) * fraction),
    variable = money((rule.bonus_mode === 'complete' ? Math.floor(extra / Number(rule.bonus_quantity || 1)) : extra / Number(rule.bonus_quantity || 1)) * Number(rule.variable_rate)),
    overtime = money(ot * Number(rule.overtime_rate));
  const workRates = JSON.parse(rule.work_rates_json || '[]'),
    work = [],
    seen = new Set();
  for (const assignment of assignments) {
    const rate = workRates.find(r => Number(r.work_activity_id) === Number(assignment.work_activity_id));
    if (!rate || !fraction) continue;
    if (rate.unit === 'day' && seen.has(rate.work_activity_id)) continue;
    seen.add(rate.work_activity_id);
    if (rate.unit !== 'day' && (assignment.work_quantity == null || assignment.work_unit !== rate.unit)) fail(`Record ${rate.unit} quantity for ${assignment.work_activity_name} in Work Assignment`);
    const units = rate.unit === 'day' ? fraction : numeric(assignment.work_quantity, 'Work quantity');
    work.push({
      work_assignment_id: assignment.work_assignment_id,
      work_activity_name: assignment.work_activity_name,
      quantity: units,
      unit: rate.unit,
      rate: rate.rate,
      amount: money(units * rate.rate)
    });
  }
  const workEarned = money(work.reduce((n, w) => n + w.amount, 0)),
    custom = money(numeric(entry?.custom_amount, 'Custom extra'));
  return {
    work_charges: work,
    work_earned: workEarned,
    custom_earned: custom,
    attendance: fraction,
    quantity,
    unit: rule.baseunit_name || '',
    included_quantity: allowance,
    extra_quantity: extra,
    overtime_hours: ot,
    fixed_earned: fixed,
    variable_earned: variable,
    overtime_earned: overtime,
    total_earned: money(fixed + variable + overtime + workEarned + custom),
    wage_rule_id: rule.wage_rule_id
  };
}
export async function payrollSetup(env, p) {
  return {
    activities: await all(env, 'SELECT work_activity_id,work_activity_name FROM work_activity WHERE property_id=? ORDER BY work_activity_name', p),
    seasons: await all(env, "SELECT season_id,season_name,start_date,end_date FROM finance_season WHERE property_id=? AND status<>'archived' ORDER BY start_date DESC", p),
    labours: await all(env, 'SELECT l.labor_id,l.name FROM labors l JOIN property p ON p.user_id=l.user_id WHERE p.property_id=? ORDER BY l.name', p),
    rules: await all(env, `${ruleQuery} WHERE r.property_id=? AND r.status='active' ORDER BY r.effective_from DESC,r.wage_rule_id DESC`, p),
    cycles: await all(env, "SELECT * FROM finance_settlement_cycle WHERE property_id=? AND status='active' ORDER BY cycle_name", p),
    units: await all(env, 'SELECT * FROM baseunit ORDER BY baseunit_name'),
    advances: await all(env, `SELECT a.*,COALESCE(ar.reason,'Other') reason,l.name labor_name,ROUND(a.amount-COALESCE((SELECT SUM(r.amount) FROM payroll_advance_recovery r WHERE r.advance_id=a.advance_id),0),2) remaining FROM payroll_advance a LEFT JOIN payroll_advance_reason ar ON ar.advance_id=a.advance_id JOIN labors l ON l.labor_id=a.labor_id WHERE a.property_id=? ORDER BY a.paid_date DESC,a.advance_id DESC`, p),
    history: await all(env, `SELECT w.*,l.name labor_name,c.cycle_name,s.breakdown_json,s.payment_method,s.settled_on,pd.payment_date FROM finance_wage_period w JOIN labors l ON l.labor_id=w.labor_id LEFT JOIN finance_settlement_cycle c ON c.settlement_cycle_id=w.settlement_cycle_id LEFT JOIN payroll_settlement s ON s.wage_period_id=w.wage_period_id LEFT JOIN payroll_payment_detail pd ON pd.wage_period_id=w.wage_period_id WHERE w.property_id=? AND w.status IN ('paid','finalized') ORDER BY w.period_end DESC,w.wage_period_id DESC`, p)
  };
}
export async function payrollDaily(env, p, day, seasonId = null) {
  date(day);
  const attendance = await all(env, 'SELECT labor_id,attendance_value FROM attendance WHERE property_id=? AND date(entry_date)=?', p, day);
  const entries = await all(env, 'SELECT d.*,COALESCE(e.custom_amount,0) custom_amount FROM payroll_daily d LEFT JOIN payroll_daily_extra e ON e.payroll_daily_id=d.payroll_daily_id WHERE property_id=? AND work_date=?', p, day);
  const rules = await all(env, `${ruleQuery} WHERE r.property_id=? AND r.status='active' AND r.effective_from<=? AND (r.effective_to IS NULL OR r.effective_to>=?) AND (r.season_id IS NULL OR r.season_id=?) ORDER BY (r.season_id IS NOT NULL) DESC,r.effective_from DESC,r.wage_rule_id DESC`, p, day, day, seasonId ? Number(seasonId) : null);
  const assignments = await all(env, `SELECT w.*,a.work_activity_name FROM work_assignment w JOIN work_activity a ON a.work_activity_id=w.work_activity_id WHERE w.property_id=? AND date(w.work_date)=?`, p, day);
  const earnings = attendance.map(a => {
    const rule = rules.find(r => r.labor_id === a.labor_id);
    if (!rule) return {
      labor_id: a.labor_id,
      error: 'Set salary rate'
    };
    try {
      return {
        labor_id: a.labor_id,
        ...calculateDay(a.attendance_value, entries.find(e => e.labor_id === a.labor_id), rule, assignments.filter(w => w.labor_id === a.labor_id))
      };
    } catch (e) {
      return {
        labor_id: a.labor_id,
        error: e.message
      };
    }
  });
  const settled = await all(env, `SELECT w.labor_id,s.breakdown_json FROM payroll_settlement s JOIN finance_wage_period w ON w.wage_period_id=s.wage_period_id WHERE w.property_id=? AND w.status IN ('paid','finalized') AND w.period_start<=? AND w.period_end>=?`, p, day, day);
  for (const settlement of settled) {
    const saved = JSON.parse(settlement.breakdown_json).days?.find(d => d.work_date === day);
    if (saved) {
      const index = earnings.findIndex(e => e.labor_id === settlement.labor_id),
        value = {
          labor_id: settlement.labor_id,
          ...saved,
          settled: true
        };
      if (index >= 0) earnings[index] = value;else earnings.push(value);
    }
  }
  return {
    attendance,
    entries,
    assignments,
    earnings
  };
}
export async function salaryPreview(env, p, b) {
  const l = await labour(env, p, b.labor_id),
    start = date(b.period_start),
    end = date(b.period_end);
  if (end < start || (Date.parse(end) - Date.parse(start)) / 86400000 > 366) fail('Select a salary period of up to one year');
  const cycle = await first(env, "SELECT * FROM finance_settlement_cycle WHERE property_id=? AND settlement_cycle_id=? AND status='active'", p, Number(b.settlement_cycle_id));
  if (!cycle) fail('Select a settlement cycle');
  if (start < cycle.effective_from || cycle.effective_to && end > cycle.effective_to) fail('Dates fall outside the settlement cycle effective period');
  if (b.season_id && !(await first(env, 'SELECT 1 FROM finance_season WHERE property_id=? AND season_id=?', p, Number(b.season_id)))) fail('Season does not belong to this property');
  const existing = await first(env, `SELECT wage_period_id,period_start,period_end,status FROM finance_wage_period WHERE property_id=? AND labor_id=? AND status IN ('paid','finalized') AND period_start<=? AND period_end>=?`, p, l.labor_id, end, start);
  if (existing) return {
    labor_id: l.labor_id,
    labor_name: l.name,
    status: existing.status === 'paid' ? 'settled' : 'partially settled',
    existing,
    days: []
  };
  const attendance = await all(env, 'SELECT date(entry_date) work_date,attendance_value FROM attendance WHERE property_id=? AND labor_id=? AND date(entry_date) BETWEEN ? AND ? ORDER BY date(entry_date)', p, l.labor_id, start, end);
  const entries = await all(env, 'SELECT d.*,COALESCE(e.custom_amount,0) custom_amount FROM payroll_daily d LEFT JOIN payroll_daily_extra e ON e.payroll_daily_id=d.payroll_daily_id WHERE property_id=? AND labor_id=? AND work_date BETWEEN ? AND ?', p, l.labor_id, start, end);
  const rules = await all(env, `${ruleQuery} WHERE r.property_id=? AND r.labor_id=? AND r.status='active' AND (r.season_id IS NULL OR r.season_id=?) ORDER BY (r.season_id IS NOT NULL) DESC,r.effective_from DESC,r.wage_rule_id DESC`, p, l.labor_id, b.season_id ? Number(b.season_id) : null);
  const assignments = await all(env, `SELECT w.*,a.work_activity_name FROM work_assignment w JOIN work_activity a ON a.work_activity_id=w.work_activity_id WHERE w.property_id=? AND w.labor_id=? AND date(w.work_date) BETWEEN ? AND ?`, p, l.labor_id, start, end);
  const errors = [],
    days = [],
    seen = new Set();
  for (const a of attendance) {
    if (seen.has(a.work_date)) {
      errors.push(`Duplicate attendance on ${a.work_date}`);
      continue;
    }
    seen.add(a.work_date);
    const rule = rules.find(r => r.effective_from <= a.work_date && (!r.effective_to || r.effective_to >= a.work_date));
    const entry = entries.find(e => e.work_date === a.work_date);
    if (!rule) {
      if (Number(a.attendance_value) > 0) errors.push(`No salary rate on ${a.work_date}`);
      continue;
    }
    if (rule.settlement_cycle_id && String(rule.settlement_cycle_id) !== String(cycle.settlement_cycle_id)) {
      errors.push(`Salary rate uses a different cycle on ${a.work_date}`);
      continue;
    }
    try {
      days.push({
        work_date: a.work_date,
        ...calculateDay(a.attendance_value, entry, rule, assignments.filter(w => String(w.work_date).slice(0, 10) === a.work_date))
      });
    } catch (e) {
      errors.push(`${a.work_date}: ${e.message}`);
    }
  }
  for (const e of entries) if (!seen.has(e.work_date) && (e.quantity || e.overtime_hours || e.custom_amount)) errors.push(`Attendance missing on ${e.work_date}`);
  if (!days.some(d => d.attendance > 0)) errors.push('No paid attendance in this period');
  const sum = key => money(days.reduce((n, d) => n + d[key], 0));
  const total = sum('total_earned');
  const advances = await all(env, `SELECT a.*,ROUND(a.amount-COALESCE((SELECT SUM(r.amount) FROM payroll_advance_recovery r WHERE r.advance_id=a.advance_id),0),2) remaining FROM payroll_advance a WHERE property_id=? AND labor_id=? AND paid_date<=? ORDER BY paid_date,advance_id`, p, l.labor_id, end);
  let available = total;
  const recoveries = [];
  for (const a of advances) {
    const recovered = money(Math.min(available, a.remaining));
    if (recovered > 0) {
      recoveries.push({
        advance_id: a.advance_id,
        amount: recovered
      });
      available = money(available - recovered);
    }
  }
  const advanceBalance = money(advances.reduce((n, a) => n + a.remaining, 0));
  const result = {
    labor_id: l.labor_id,
    labor_name: l.name,
    status: errors.length ? 'needs attention' : 'unsettled',
    errors,
    period_start: start,
    period_end: end,
    settlement_cycle_id: cycle.settlement_cycle_id,
    cycle_name: cycle.cycle_name,
    season_id: b.season_id ? Number(b.season_id) : null,
    days,
    attendance_days: sum('attendance'),
    work_earned: sum('work_earned'),
    custom_earned: sum('custom_earned'),
    fixed_earned: sum('fixed_earned'),
    variable_earned: sum('variable_earned'),
    overtime_earned: sum('overtime_earned'),
    total_earned: total,
    advance_paid: money(total - available),
    settled_paid: available,
    advance_remaining: money(advanceBalance - (total - available)),
    recoveries
  };
  // The client must confirm this exact preview; totals are never accepted from it.
  result.preview_key = JSON.stringify(result);
  return result;
}
export async function payrollWrite(env, p, action, b, who) {
  await labour(env, p, b.labor_id);
  if (action === 'daily') {
    const workDate = date(b.work_date),
      quantity = numeric(b.quantity, 'Harvest'),
      ot = numeric(b.overtime_hours, 'OT hours', 24);
    if (await first(env, "SELECT 1 FROM finance_wage_period WHERE property_id=? AND labor_id=? AND status IN ('paid','finalized') AND period_start<=? AND period_end>=?", p, Number(b.labor_id), workDate, workDate)) fail('This date is already settled', 409);
    const a = await first(env, 'SELECT attendance_value FROM attendance WHERE property_id=? AND labor_id=? AND date(entry_date)=?', p, Number(b.labor_id), workDate);
    if (!a || Number(a.attendance_value) <= 0) fail('Mark full-day or half-day attendance first');
    if (quantity && !(await first(env, 'SELECT 1 FROM baseunit WHERE baseunit_id=?', Number(b.unit_id)))) fail('Select a harvest unit');
    const custom = money(numeric(b.custom_amount, 'Custom extra'));
    await env.DB.batch([env.DB.prepare(`INSERT INTO payroll_daily(property_id,labor_id,work_date,quantity,unit_id,overtime_hours,notes,modified_by) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(property_id,labor_id,work_date) DO UPDATE SET quantity=excluded.quantity,unit_id=excluded.unit_id,overtime_hours=excluded.overtime_hours,notes=excluded.notes,modified_by=excluded.modified_by,modified_on=CURRENT_TIMESTAMP`).bind(p, Number(b.labor_id), workDate, quantity, b.unit_id ? Number(b.unit_id) : null, ot, b.notes || '', who), env.DB.prepare(`INSERT INTO payroll_daily_extra(payroll_daily_id,custom_amount) VALUES((SELECT payroll_daily_id FROM payroll_daily WHERE property_id=? AND labor_id=? AND work_date=?),?) ON CONFLICT(payroll_daily_id) DO UPDATE SET custom_amount=excluded.custom_amount`).bind(p, Number(b.labor_id), workDate, custom)]);
    return {
      ok: true
    };
  }
  if (action === 'advance') {
    const n = money(numeric(b.amount, 'Advance'));
    if (!n) fail('Enter an advance amount');
    const reason = String(b.reason || 'Other').slice(0, 80);
    const results = await env.DB.batch([env.DB.prepare('INSERT INTO payroll_advance(property_id,labor_id,paid_date,amount,notes,created_by) VALUES(?,?,?,?,?,?)').bind(p, Number(b.labor_id), date(b.paid_date), n, b.notes || '', who), env.DB.prepare('INSERT INTO payroll_advance_reason(advance_id,reason) VALUES(last_insert_rowid(),?)').bind(reason)]);
    const r = results[0];
    return {
      id: r.meta.last_row_id
    };
  }
  if (action === 'rule') {
    const start = date(b.effective_from),
      fixed = numeric(b.fixed_rate, 'Daily rate'),
      variable = numeric(b.variable_rate, 'Extra yield rate'),
      ot = numeric(b.overtime_rate, 'OT rate'),
      included = numeric(b.included_quantity, 'Included harvest');
    const cycle = await first(env, "SELECT 1 FROM finance_settlement_cycle WHERE property_id=? AND settlement_cycle_id=? AND status='active'", p, Number(b.settlement_cycle_id));
    if (!cycle) fail('Select a settlement cycle');
    if ((variable || included) && !(await first(env, 'SELECT 1 FROM baseunit WHERE baseunit_id=?', Number(b.variable_unit_id)))) fail('Select the yield unit');
    if (b.effective_to && date(b.effective_to) < start) fail('Rate end date must follow its start');
    if (b.season_id && !(await first(env, 'SELECT 1 FROM finance_season WHERE property_id=? AND season_id=?', p, Number(b.season_id)))) fail('Invalid season');
    const workRates = Array.isArray(b.work_rates) ? b.work_rates : JSON.parse(b.work_rates_json || '[]');
    if (workRates.length > 50) fail('Too many work rates');
    const seen = new Set();
    for (const rate of workRates) {
      rate.work_activity_id = Number(rate.work_activity_id);
      rate.rate = numeric(rate.rate, 'Work rate');
      if (!['acre', 'tree', 'day', 'kg', 'bushel'].includes(rate.unit) || seen.has(rate.work_activity_id)) fail('Select a unique work type and unit');
      seen.add(rate.work_activity_id);
      if (!(await first(env, 'SELECT 1 FROM work_activity WHERE property_id=? AND work_activity_id=?', p, rate.work_activity_id))) fail('Work type does not belong to this property');
    }
    const bonusQuantity = numeric(b.bonus_quantity ?? 1, 'Bonus quantity');
    if (!bonusQuantity) fail('Bonus quantity must be greater than zero');
    const bonusMode = b.bonus_mode || 'proportional';
    if (!['proportional', 'complete'].includes(bonusMode)) fail('Invalid bonus mode');
    const results = await env.DB.batch([env.DB.prepare(`INSERT INTO finance_wage_rule(property_id,labor_id,season_id,settlement_cycle_id,effective_from,effective_to,fixed_rate,fixed_basis,variable_rate,variable_unit_id,overtime_rate,created_by) VALUES(?,?,?,?,?,?,?,'day',?,?,?,?)`).bind(p, Number(b.labor_id), b.season_id ? Number(b.season_id) : null, Number(b.settlement_cycle_id), start, b.effective_to || null, fixed, variable, b.variable_unit_id ? Number(b.variable_unit_id) : null, ot, who), env.DB.prepare(`INSERT INTO payroll_rule_detail(wage_rule_id,included_quantity,prorate_allowance) VALUES(last_insert_rowid(),?,1)`).bind(included), env.DB.prepare(`INSERT INTO payroll_rule_options(wage_rule_id,work_rates_json,bonus_quantity,bonus_mode) VALUES(last_insert_rowid(),?,?,?)`).bind(JSON.stringify(workRates), bonusQuantity, bonusMode)]);
    return {
      id: results[0].meta.last_row_id
    };
  }
  if (action === 'settle') {
    if (date(b.period_end) > new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata'
    })) fail('Salary cannot be settled for future dates');
    const preview = await salaryPreview(env, p, b);
    if (preview.status !== 'unsettled') fail(preview.errors?.join('; ') || 'Salary already settled', 409);
    if (b.preview_key !== preview.preview_key) fail('Salary inputs changed. Refresh and review the preview before settling.', 409);
    const method = b.payment_method || 'cash';
    if (!['cash', 'bank', 'upi'].includes(method)) fail('Select a payment method');
    const paidDate = date(b.payment_date || new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata'
    }));
    if (paidDate < b.period_end || paidDate > new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata'
    })) fail('Payment date must be on or after the period end and not in the future');
    if (b.amount_paid != null && money(numeric(b.amount_paid, 'Amount paid')) !== preview.settled_paid) fail('Amount paid must match net payable to mark this salary paid');
    const v = preview;
    const periodSql = 'SELECT wage_period_id FROM finance_wage_period WHERE property_id=? AND labor_id=? AND period_start=? AND period_end=?';
    const args = [p, v.labor_id, v.period_start, v.period_end];
    const statements = [env.DB.prepare(`INSERT INTO finance_wage_period(property_id,labor_id,season_id,settlement_cycle_id,wage_rule_id,period_start,period_end,fixed_earned,variable_earned,overtime_earned,total_earned,advance_paid,settled_paid,outstanding_balance,status,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,0,'paid',?)`).bind(p, v.labor_id, v.season_id, v.settlement_cycle_id, v.days.find(d => d.attendance > 0).wage_rule_id, v.period_start, v.period_end, v.fixed_earned, v.variable_earned, v.overtime_earned, v.total_earned, v.advance_paid, v.settled_paid, who), env.DB.prepare(`INSERT INTO payroll_settlement(wage_period_id,breakdown_json,payment_method) VALUES((${periodSql}),?,?)`).bind(...args, JSON.stringify({
      ...v,
      preview_key: undefined
    }), method), env.DB.prepare(`INSERT INTO payroll_payment_detail(wage_period_id,payment_date) VALUES((${periodSql}),?)`).bind(...args, paidDate)];
    for (const r of v.recoveries) statements.push(env.DB.prepare(`INSERT INTO payroll_advance_recovery(wage_period_id,advance_id,amount) VALUES((${periodSql}),?,?)`).bind(...args, r.advance_id, r.amount));
    statements.push(env.DB.prepare(`INSERT INTO running_expenses(expensetype_id,property_id,season_id,expense_code,expense_occurence_date,other_expense,description,payment_status,payment_method,source_type,source_id,status,created_by) VALUES((SELECT expensetype_id FROM expensetype WHERE expense_code='LABOUR' LIMIT 1),?,?,'Labour salary',?,?,?,'paid',?,'wage_period',(${periodSql}),'confirmed',?)`).bind(p, v.season_id, v.period_end, v.total_earned, `Salary: ${v.labor_name}, ${v.period_start} to ${v.period_end}`, method, ...args, who));
    statements.push(env.DB.prepare(`UPDATE finance_wage_period SET expense_id=(SELECT expense_id FROM running_expenses WHERE source_type='wage_period' AND source_id=finance_wage_period.wage_period_id) WHERE wage_period_id=(${periodSql})`).bind(...args));
    try {
      const results = await env.DB.batch(statements);
      return {
        id: results[0].meta.last_row_id,
        paid: v.settled_paid,
        status: 'settled'
      };
    } catch (e) {
      if (/overlapping|already recovered|UNIQUE constraint/i.test(e.message)) fail('Salary or advances were settled elsewhere. Refresh the preview.', 409);
      throw e;
    }
  }
  fail('Unknown payroll action');
}
