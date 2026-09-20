import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import Database from 'better-sqlite3';
import { d1Adapter } from '../src/utils/d1Adapter.js';
import { calculateDay, payrollWrite, salaryPreview, payrollSetup, payrollDaily } from '../../functions/_shared/payroll.js';
import { financeSetup, saveCommissionRule } from '../../functions/_shared/finance.js';
import { onRequestGet, onRequestPost } from '../../functions/api/payroll/[action].js';
const target = path.join(os.tmpdir(), `estate-payroll-test-${process.pid}.sqlite`);
const source = new Database(path.resolve('data/coffee-estate.sqlite'), {
  readonly: true
});
await source.backup(target);
source.close();
process.env.DATABASE_FILE = target;
const {
  db
} = await import('../src/db.js');
const migration = fs.readFileSync('../migrations/0023_labour_payroll.sql', 'utf8');
db.exec(migration);
db.exec(migration);
if (!db.prepare("SELECT 1 FROM sqlite_master WHERE name='payroll_rule_options'").get()) db.exec(fs.readFileSync('../migrations/0024_salary_simple_flow.sql', 'utf8'));
const env = d1Adapter(db);
let server;
try {
  const p = db.prepare('SELECT * FROM property ORDER BY property_id LIMIT 1').get();
  const labor = db.prepare("INSERT INTO labors(user_id,name) VALUES(?,'Payroll test worker') RETURNING *").get(p.user_id);
  const vendor = db.prepare('SELECT vendor_id FROM vendor WHERE user_id=? LIMIT 1').get(p.user_id);
  const link = db.prepare("INSERT INTO laborvendor(labor_id,vendor_id,laborvendorcode) VALUES(?,?,'PAYROLL-TEST-LINK') RETURNING *").get(labor.labor_id, vendor.vendor_id);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM propertylabor WHERE labor_id=?').get(labor.labor_id).n, 0);
  assert.ok((await financeSetup(env, p.property_id)).vendorLabours.some(x => x.laborvendor_id === link.laborvendor_id), 'Owner-wide vendor mapping must not require obsolete propertylabor membership');
  await saveCommissionRule(env, p.property_id, {
    laborvendor_id: link.laborvendor_id,
    effective_from: '2026-09-01',
    commission_percentage: 10
  }, 'Test');
  const cycle = db.prepare("INSERT INTO finance_settlement_cycle(property_id,cycle_name,frequency,effective_from) VALUES(?,'Test week','weekly','2026-09-01') RETURNING *").get(p.property_id);
  const unit = db.prepare('SELECT baseunit_id FROM baseunit LIMIT 1').get().baseunit_id;
  const base = {
    labor_id: labor.labor_id,
    settlement_cycle_id: cycle.settlement_cycle_id
  };
  await payrollWrite(env, p.property_id, 'rule', {
    ...base,
    effective_from: '2026-09-01',
    fixed_rate: 500,
    variable_rate: 50,
    overtime_rate: 100,
    included_quantity: 5,
    variable_unit_id: unit
  }, 'Test');
  const r = (await payrollSetup(env, p.property_id)).rules.find(x => x.labor_id === labor.labor_id);
  assert.equal(r.included_quantity, 5);
  assert.equal(calculateDay(1, {
    quantity: 5,
    unit_id: unit
  }, r).total_earned, 500);
  assert.equal(calculateDay(1, {
    quantity: 7,
    unit_id: unit,
    overtime_hours: 2
  }, r).total_earned, 800);
  assert.equal(calculateDay(0.5, {
    quantity: 3.5,
    unit_id: unit,
    overtime_hours: 1
  }, r).total_earned, 400);
  assert.equal(calculateDay(0.5, {
    quantity: 2,
    unit_id: unit
  }, r).total_earned, 250);
  assert.equal(calculateDay(0, {}, r).total_earned, 0);
  assert.throws(() => calculateDay(1, {
    quantity: 7,
    unit_id: -1
  }, r), /unit/);
  assert.throws(() => calculateDay(0, {
    overtime_hours: 1
  }, r), /absent/);
  assert.throws(() => calculateDay(1.5, {}, r), /Attendance/);
  for (const [day, attendance] of [['2026-09-01', 1], ['2026-09-02', 0.5], ['2026-09-03', 0], ['2026-09-08', 1]]) db.prepare("INSERT INTO attendance(labor_id,property_id,user_id,entry_date,attendance_value,created_by) VALUES(?,?,?,?,?,'Test')").run(labor.labor_id, p.property_id, p.user_id, day, attendance);
  await payrollWrite(env, p.property_id, 'daily', {
    ...base,
    work_date: '2026-09-01',
    quantity: 7,
    unit_id: unit,
    overtime_hours: 2
  }, 'Test');
  await payrollWrite(env, p.property_id, 'daily', {
    ...base,
    work_date: '2026-09-02',
    quantity: 3.5,
    unit_id: unit,
    overtime_hours: 1
  }, 'Test');
  assert.equal((await payrollDaily(env, p.property_id, '2026-09-02')).entries.find(x => x.labor_id === labor.labor_id).quantity, 3.5);
  await assert.rejects(payrollWrite(env, p.property_id, 'daily', {
    ...base,
    work_date: '2026-09-03',
    quantity: 1,
    unit_id: unit
  }, 'Test'), /attendance/);
  await assert.rejects(payrollWrite(env, p.property_id, 'advance', {
    ...base,
    amount: -10,
    paid_date: '2026-09-01'
  }, 'Test'), /invalid/);
  await payrollWrite(env, p.property_id, 'advance', {
    ...base,
    amount: 1500,
    paid_date: '2026-09-01'
  }, 'Test');
  const period = {
    ...base,
    period_start: '2026-09-01',
    period_end: '2026-09-07'
  };
  let preview = await salaryPreview(env, p.property_id, period);
  assert.equal(preview.fixed_earned, 750);
  assert.equal(preview.variable_earned, 150);
  assert.equal(preview.overtime_earned, 300);
  assert.equal(preview.total_earned, 1200);
  assert.equal(preview.advance_paid, 1200);
  assert.equal(preview.settled_paid, 0);
  assert.equal(preview.advance_remaining, 300);
  await assert.rejects(payrollWrite(env, p.property_id, 'settle', {
    ...period,
    preview_key: 'stale'
  }, 'Test'), /changed/);
  const saved = await payrollWrite(env, p.property_id, 'settle', {
    ...period,
    preview_key: preview.preview_key
  }, 'Test');
  assert.equal(saved.status, 'settled');
  assert.equal((await salaryPreview(env, p.property_id, period)).status, 'settled');
  await assert.rejects(payrollWrite(env, p.property_id, 'settle', {
    ...period,
    preview_key: preview.preview_key
  }, 'Test'), /already settled/);
  await assert.rejects(payrollWrite(env, p.property_id, 'daily', {
    ...base,
    work_date: '2026-09-01',
    quantity: 1,
    unit_id: unit
  }, 'Test'), /already settled/);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM running_expenses WHERE source_type='wage_period' AND source_id=?").get(saved.id).n, 1);
  const next = {
    ...base,
    period_start: '2026-09-08',
    period_end: '2026-09-14'
  };
  preview = await salaryPreview(env, p.property_id, next);
  assert.equal(preview.advance_paid, 300);
  assert.equal(preview.settled_paid, 200);
  await payrollWrite(env, p.property_id, 'settle', {
    ...next,
    preview_key: preview.preview_key,
    payment_method: 'bank'
  }, 'Test');
  assert.equal((await payrollSetup(env, p.property_id)).advances.find(a => a.labor_id === labor.labor_id).remaining, 0);
  await assert.rejects(payrollWrite(env, -1, 'advance', {
    ...base,
    amount: 100,
    paid_date: '2026-09-01'
  }, 'Test'), /belong/);
  // Database-level overlap protection covers simultaneous or legacy finalization too.
  assert.throws(() => db.prepare("INSERT INTO finance_wage_period(property_id,labor_id,wage_rule_id,period_start,period_end,status) VALUES(?,?,?,'2026-09-02','2026-09-09','paid')").run(p.property_id, labor.labor_id, r.wage_rule_id), /overlapping/);
  // Future rate edits cannot change the already settled daily salary snapshot.
  await payrollWrite(env, p.property_id, 'rule', {
    ...base,
    effective_from: '2026-09-01',
    fixed_rate: 999,
    variable_rate: 0,
    overtime_rate: 0,
    included_quantity: 5,
    variable_unit_id: unit
  }, 'Test');
  assert.equal((await payrollDaily(env, p.property_id, '2026-09-01')).earnings.find(e => e.labor_id === labor.labor_id).total_earned, 800);
  // A rate change mid-period uses each day's effective rate and rejects stale review.
  for (const day of ['2026-09-15', '2026-09-16']) db.prepare("INSERT INTO attendance(labor_id,property_id,user_id,entry_date,attendance_value,created_by) VALUES(?,?,?,?,1,'Test')").run(labor.labor_id, p.property_id, p.user_id, day);
  const changedPeriod = {
    ...base,
    period_start: '2026-09-15',
    period_end: '2026-09-16'
  };
  const stale = await salaryPreview(env, p.property_id, changedPeriod);
  await payrollWrite(env, p.property_id, 'rule', {
    ...base,
    effective_from: '2026-09-16',
    fixed_rate: 600,
    variable_rate: 0,
    overtime_rate: 0,
    included_quantity: 5,
    variable_unit_id: unit
  }, 'Test');
  const changed = await salaryPreview(env, p.property_id, changedPeriod);
  assert.equal(changed.total_earned, 1599);
  await assert.rejects(payrollWrite(env, p.property_id, 'settle', {
    ...changedPeriod,
    preview_key: stale.preview_key
  }, 'Test'), /changed/);
  // Two settlements for different dates cannot deduct the same remaining advance.
  await payrollWrite(env, p.property_id, 'advance', {
    ...base,
    amount: 500,
    paid_date: '2026-09-15'
  }, 'Test');
  const periodA = {
      ...base,
      period_start: '2026-09-15',
      period_end: '2026-09-15'
    },
    periodB = {
      ...base,
      period_start: '2026-09-16',
      period_end: '2026-09-16'
    };
  const [a, b] = await Promise.all([salaryPreview(env, p.property_id, periodA), salaryPreview(env, p.property_id, periodB)]);
  const concurrent = await Promise.allSettled([payrollWrite(env, p.property_id, 'settle', {
    ...periodA,
    preview_key: a.preview_key
  }, 'Test'), payrollWrite(env, p.property_id, 'settle', {
    ...periodB,
    preview_key: b.preview_key
  }, 'Test')]);
  assert.equal(concurrent.filter(x => x.status === 'fulfilled').length, 1);
  const savedDates = db.prepare("SELECT COUNT(*) n FROM finance_wage_period WHERE labor_id=? AND period_start IN ('2026-09-15','2026-09-16')").get(labor.labor_id).n;
  assert.equal(savedDates, 1, 'Failed concurrent recovery must roll back wage period and expense');
  // Reference flow: full-day wage 600 + one acre of assigned work at 250 = 850.
  const worker = db.prepare("INSERT INTO labors(user_id,name) VALUES(?,'Simple flow worker') RETURNING *").get(p.user_id);
  const activity = db.prepare("INSERT INTO work_activity(property_id,work_activity_name) VALUES(?,'Salary test fertilization') RETURNING *").get(p.property_id);
  const profile = {
    labor_id: worker.labor_id,
    settlement_cycle_id: cycle.settlement_cycle_id,
    effective_from: '2026-09-01',
    fixed_rate: 600,
    variable_rate: 600,
    overtime_rate: 150,
    included_quantity: 0,
    variable_unit_id: unit,
    bonus_quantity: 3,
    bonus_mode: 'complete',
    work_rates: [{
      work_activity_id: activity.work_activity_id,
      unit: 'acre',
      rate: 250
    }]
  };
  const savedRate = await payrollWrite(env, p.property_id, 'rule', profile, 'Test');
  assert.equal(db.prepare('SELECT bonus_quantity FROM payroll_rule_options WHERE wage_rule_id=?').get(savedRate.id).bonus_quantity, 3);
  const rule = (await payrollSetup(env, p.property_id)).rules.find(x => x.wage_rule_id === savedRate.id);
  assert.equal(calculateDay(1, {
    quantity: 2.9,
    unit_id: unit
  }, rule).variable_earned, 0);
  assert.equal(calculateDay(1, {
    quantity: 3,
    unit_id: unit
  }, rule).variable_earned, 600);
  assert.equal(calculateDay(1, {
    quantity: 7,
    unit_id: unit
  }, {
    ...rule,
    bonus_quantity: 4
  }).variable_earned, 600);
  assert.equal(calculateDay(1, {
    quantity: 8,
    unit_id: unit
  }, {
    ...rule,
    bonus_quantity: 4
  }).variable_earned, 1200);
  assert.equal(calculateDay(0.5, {
    quantity: 5.5,
    unit_id: unit
  }, {
    ...rule,
    included_quantity: 5
  }).variable_earned, 600);
  db.prepare("INSERT INTO attendance(labor_id,property_id,user_id,entry_date,attendance_value,created_by) VALUES(?,?,?,'2026-09-18',1,'Test')").run(worker.labor_id, p.property_id, p.user_id);
  const assignment = db.prepare("INSERT INTO work_assignment(property_id,labor_id,work_activity_id,work_date,work_quantity,work_unit,block_id) VALUES(?,?,?,'2026-09-18',1,'acre',?) RETURNING *").get(p.property_id, worker.labor_id, activity.work_activity_id, db.prepare('SELECT block_id FROM blocks WHERE property_id=? LIMIT 1').get(p.property_id).block_id);
  await payrollWrite(env, p.property_id, 'daily', {
    labor_id: worker.labor_id,
    work_date: '2026-09-18'
  }, 'Test');
  let dailyResult = await payrollDaily(env, p.property_id, '2026-09-18');
  assert.ok(dailyResult.assignments.some(x => x.work_assignment_id === assignment.work_assignment_id && x.work_activity_name === 'Salary test fertilization'));
  assert.equal(dailyResult.earnings.find(x => x.labor_id === worker.labor_id).total_earned, 850);
  await payrollWrite(env, p.property_id, 'daily', {
    labor_id: worker.labor_id,
    work_date: '2026-09-18',
    custom_amount: 100,
    overtime_hours: 1,
    quantity: 3,
    unit_id: unit
  }, 'Test');
  const salaryPeriod = {
    labor_id: worker.labor_id,
    settlement_cycle_id: cycle.settlement_cycle_id,
    period_start: '2026-09-18',
    period_end: '2026-09-18'
  };
  let full = await salaryPreview(env, p.property_id, salaryPeriod);
  assert.equal(full.total_earned, 1700);
  assert.equal(full.work_earned, 250);
  assert.equal(full.custom_earned, 100);
  await payrollWrite(env, p.property_id, 'advance', {
    labor_id: worker.labor_id,
    amount: 200,
    paid_date: '2026-09-18',
    reason: 'Medical',
    notes: 'Clinic'
  }, 'Test');
  assert.equal((await payrollSetup(env, p.property_id)).advances.find(a => a.labor_id === worker.labor_id).reason, 'Medical');
  full = await salaryPreview(env, p.property_id, salaryPeriod);
  assert.equal(full.settled_paid, 1500);
  await assert.rejects(payrollWrite(env, p.property_id, 'settle', {
    ...salaryPeriod,
    preview_key: full.preview_key,
    amount_paid: 1400
  }, 'Test'), /match net payable/);
  await assert.rejects(payrollWrite(env, p.property_id, 'settle', {
    ...salaryPeriod,
    preview_key: full.preview_key,
    payment_date: '2026-09-17'
  }, 'Test'), /Payment date/);
  const paid = await payrollWrite(env, p.property_id, 'settle', {
    ...salaryPeriod,
    preview_key: full.preview_key,
    amount_paid: 1500,
    payment_date: '2026-09-18'
  }, 'Test');
  assert.equal((await payrollSetup(env, p.property_id)).history.find(h => h.wage_period_id === paid.id).payment_date, '2026-09-18');
  assert.throws(() => calculateDay(1, {}, rule, [{
    ...assignment,
    work_quantity: null,
    work_activity_name: 'Fertilization'
  }]), /Record acre quantity/);
  // Seasonal wages override regular wages only for the selected season and dates.
  const seasonal = db.prepare('SELECT season_id FROM finance_season WHERE property_id=? LIMIT 1').get(p.property_id);
  if (seasonal) {
    const seasonalRate = await payrollWrite(env, p.property_id, 'rule', {
      ...profile,
      season_id: seasonal.season_id,
      fixed_rate: 700,
      effective_to: '2026-09-30'
    }, 'Test');
    db.prepare("INSERT INTO attendance(labor_id,property_id,user_id,entry_date,attendance_value,created_by) VALUES(?,?,?,'2026-09-19',0.5,'Test')").run(worker.labor_id, p.property_id, p.user_id);
    assert.equal((await payrollDaily(env, p.property_id, '2026-09-19', seasonal.season_id)).earnings.find(x => x.labor_id === worker.labor_id).fixed_earned, 350);
    assert.equal((await payrollDaily(env, p.property_id, '2026-09-19')).earnings.find(x => x.labor_id === worker.labor_id).fixed_earned, 300);
  }
  const token = randomBytes(32).toString('hex');
  db.prepare("INSERT INTO auth_session(user_id,token_hash,expires_on) VALUES(?,?,datetime('now','+1 hour'))").run(p.user_id, createHash('sha256').update(token).digest('hex'));
  const headers = {
    authorization: `Bearer ${token}`,
    'x-property-id': String(p.property_id),
    'content-type': 'application/json'
  };
  let response = await onRequestGet({
    request: new Request('https://test/api/payroll/setup', {
      headers
    }),
    env,
    params: {
      action: 'setup'
    }
  });
  assert.equal(response.status, 200);
  assert.ok((await response.json()).history.some(h => h.wage_period_id === saved.id));
  response = await onRequestGet({
    request: new Request('https://test/api/payroll/setup'),
    env,
    params: {
      action: 'setup'
    }
  });
  assert.equal(response.status, 401);
  response = await onRequestPost({
    request: new Request('https://test/api/payroll/advance', {
      headers,
      method: 'POST',
      body: JSON.stringify({
        ...base,
        amount: -1,
        paid_date: '2026-09-01'
      })
    }),
    env,
    params: {
      action: 'advance'
    }
  });
  assert.equal(response.status, 400);
  const {
    createApp
  } = await import('../src/app.js');
  server = createApp().listen(0);
  await new Promise(r => server.once('listening', r));
  response = await fetch(`http://127.0.0.1:${server.address().port}/api/payroll/setup`, {
    headers
  });
  assert.equal(response.status, 200);
  assert.ok((await response.json()).labours.some(l => l.labor_id === labor.labor_id));
  response = await fetch(`http://127.0.0.1:${server.address().port}/api/finance/setup`, {
    headers
  });
  assert.ok((await response.json()).vendorLabours.some(l => l.laborvendor_id === link.laborvendor_id));
  response = await fetch(`http://127.0.0.1:${server.address().port}/api/workAssignments/${assignment.work_assignment_id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      work_quantity: 2,
      work_unit: 'acre'
    })
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).work_quantity, 2);
  const {
    updateResource
  } = await import('../../functions/_shared/crud.js');
  response = await updateResource(new Request('https://test/api/workAssignments/' + assignment.work_assignment_id, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      work_quantity: 3,
      work_unit: 'acre'
    })
  }), env, 'workAssignments', assignment.work_assignment_id);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).work_quantity, 3);
  response = await updateResource(new Request('https://test/api/workAssignments/' + assignment.work_assignment_id, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      work_quantity: -1,
      work_unit: 'acre'
    })
  }), env, 'workAssignments', assignment.work_assignment_id).catch(e => ({
    status: e.status
  }));
  assert.equal(response.status, 400);
  console.log('PASS: payroll calculations, half-day threshold, advances and carry-forward, settlement snapshots, duplicate/overlap protection, owner-wide vendor mapping, local and Cloudflare routes, authorization, idempotent migration.');
} finally {
  if (server) await new Promise(r => server.close(r));
  db.close();
  fs.rmSync(target, {
    force: true
  });
}
