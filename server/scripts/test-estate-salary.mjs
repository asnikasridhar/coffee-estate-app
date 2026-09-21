import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { createHash, randomBytes } from 'node:crypto';
import { onRequestGet, onRequestPost } from '../../functions/api/payroll/[action].js';
import { financeOverview } from '../../functions/_shared/finance.js';
import { d1Adapter } from '../src/utils/d1Adapter.js';
import { workCompletionDay, saveWorkCompletion, estateRates, estateWrite, estatePreview, estateDay, salaryReport, calculateEstateDay, assignmentEstimate, resolveRate } from '../../functions/_shared/estateSalary.js';
const file = path.join(os.tmpdir(), `estate-versions-${process.pid}.sqlite`);
const source = new Database(path.resolve('data/coffee-estate.sqlite'), {
  readonly: true
});
await source.backup(file);
source.close();
process.env.DATABASE_FILE = file;
const db = new Database(file);
db.pragma('foreign_keys = ON');
try {
  for (const [table, migration] of [['payroll_daily', '0023_labour_payroll.sql'], ['payroll_rule_options', '0024_salary_simple_flow.sql'], ['estate_rate_version', '0025_estate_rate_versions.sql'], ['labour_rate_exception', '0026_labour_rate_exceptions.sql'], ['work_completion', '0027_work_completion.sql']]) if (!db.prepare('SELECT 1 FROM sqlite_master WHERE name=?').get(table)) db.exec(fs.readFileSync(`../migrations/${migration}`, 'utf8'));
  const owner = db.prepare('SELECT * FROM property LIMIT 1').get();
  const p = db.prepare("INSERT INTO property(user_id,property_name) VALUES(?,'Versioned salary test') RETURNING *").get(owner.user_id);
  const env = d1Adapter(db),
    id = p.property_id,
    who = String(owner.user_id),
    day = '2026-09-20';
  const unit = db.prepare('SELECT baseunit_id FROM baseunit LIMIT 1').get().baseunit_id;
  const workers = ['Best Labour', 'Sundara', 'Novan'].map(name => db.prepare('INSERT INTO labors(user_id,name) VALUES(?,?) RETURNING *').get(p.user_id, name));
  const activities = ['Fertilization', 'Weeding', 'Harvesting'].map(name => db.prepare('INSERT INTO work_activity(property_id,work_activity_name) VALUES(?,?) RETURNING *').get(id, name));
  const block = db.prepare('SELECT * FROM blocks WHERE property_id=? LIMIT 1').get(owner.property_id);
  // Old databases may enforce block membership. A dedicated block uses the actual table columns.
  const blockData = {
    ...block,
    property_id: id,
    block_name: 'Test block'
  };
  delete blockData.block_id;
  const cols = Object.keys(blockData),
    newBlock = db.prepare(`INSERT INTO blocks(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')}) RETURNING *`).get(...cols.map(k => blockData[k]));
  const saveRate = (category, from, to, payload) => estateWrite(env, id, 'rate-version', {
    category,
    effective_from: from,
    effective_to: to,
    payload
  }, who);
  await saveRate('daily', '2026-01-01', '2026-06-30', {
    full_day: 80,
    half_day: 40
  });
  await saveRate('daily', '2026-07-01', '2026-12-31', {
    full_day: 100,
    half_day: 50
  });
  await saveRate('work', '2026-01-01', '2026-12-31', {
    rates: activities.map((a, i) => ({
      work_activity_id: a.work_activity_id,
      unit: i === 2 ? 'work' : 'acre',
      rate: [50, 20, 60][i]
    }))
  });
  await saveRate('seasonal', '2026-09-01', '2026-10-31', {
    name: 'Coffee Harvest',
    minimum_quantity: 3,
    bonus_amount: 50,
    unit_id: unit
  });
  const ot = await estateWrite(env, id, 'overtime-type', {
    name: 'Overtime',
    unit: 'hour'
  }, who);
  await saveRate('overtime', '2026-01-01', '2026-12-31', {
    rates: [{
      overtime_type_id: ot.id,
      rate: 150
    }]
  });
  const setup = await estateRates(env, id),
    pure = (date, extra = {}) => calculateEstateDay({
      day: date,
      attendance: 1,
      versions: setup.versions,
      ...extra
    });
  for (const d of ['2026-01-01', '2026-06-30']) assert.equal(pure(d).fixed_earned, 80);
  for (const d of ['2026-07-01', '2026-12-31']) assert.equal(pure(d).fixed_earned, 100);
  assert.throws(() => pure('2027-01-01'), /No active daily/);
  assert.throws(() => pure('2025-12-31'), /No active daily/);
  await assert.rejects(saveRate('daily', '2026-06-30', '2026-07-05', {
    full_day: 90,
    half_day: 45
  }), /overlap/);
  assert.throws(() => db.prepare('UPDATE estate_rate_version SET payload_json=? WHERE property_id=?').run('{"full_day":1000}', id), /immutable/);
  assert.throws(() => db.prepare('DELETE FROM estate_rate_version WHERE property_id=?').run(id), /cannot be deleted/);
  const seasonal = {
    ...setup.versions.find(v => v.category === 'seasonal'),
    payload: {
      ...setup.versions.find(v => v.category === 'seasonal').payload,
      full_day: 120,
      half_day: 60
    }
  };
  const versions = setup.versions.map(v => v.category === 'seasonal' ? seasonal : v);
  assert.equal(pure(day, {
    versions
  }).fixed_earned, 120);
  assert.equal(pure(day, {
    versions,
    input: {
      use_regular: true
    }
  }).fixed_earned, 100);
  assert.equal(pure(day, {
    input: {
      quantity: 2.999,
      unit_id: unit
    }
  }).variable_earned, 0);
  assert.equal(pure(day, {
    input: {
      quantity: 9,
      unit_id: unit
    }
  }).variable_earned, 50, 'Threshold bonus must not repeat per group');
  assert.equal(pure(day, {
    input: {
      extras: [{
        overtime_type_id: ot.id,
        quantity: 2
      }]
    }
  }).overtime_earned, 300);
  assert.throws(() => pure(day, {
    assignments: [{
      work_activity_id: 999,
      work_activity_name: 'Missing'
    }]
  }), /No active Missing/);
  for (let i = 0; i < workers.length; i++) {
    db.prepare("INSERT INTO attendance(labor_id,property_id,user_id,entry_date,attendance_value,created_by) VALUES(?,?,?,?,?,'Test')").run(workers[i].labor_id, id, p.user_id, day, i === 2 ? .5 : 1);
    db.prepare('INSERT INTO work_assignment(property_id,labor_id,work_date,work_activity_id,block_id,work_quantity,work_unit) VALUES(?,?,?,?,?,?,?)').run(id, workers[i].labor_id, day, activities[i].work_activity_id, newBlock.block_id, i===2?null:1, i===2?null:'acre');
  }
  await estateWrite(env, id, 'settlement-input', {
    labor_id: workers[2].labor_id,
    work_date: day,
    quantity: 5,
    unit_id: unit
  }, who);
  await estateWrite(env, id, 'settlement-advance', {
    labor_id: workers[1].labor_id,
    work_date: day,
    amount: 20,
    reason: 'Personal'
  }, who);
  const completion=await workCompletionDay(env,id,day);
  await saveWorkCompletion(env,id,{date:day,items:completion.labours.flatMap(l=>l.assignments.map(a=>({work_assignment_id:a.work_assignment_id,assignment_key:a.assignment_key,revision:a.revision,actual_quantity:a.is_harvest?5:1})))},who);
  const list = await estateDay(env, id, day);
  assert.deepEqual(list.rows.map(r => r.total_earned), [150, 120, 160]);
  assert.deepEqual(list.rows.map(r => r.settled_paid), [150, 100, 160]);
  assert.equal(list.rows.reduce((n, r) => n + r.total_earned, 0), 430);
  assert.equal(list.rows.reduce((n, r) => n + r.settled_paid, 0), 410);
  const estimate = await assignmentEstimate(env, id, {
    date: day,
    work_activity_id: activities[0].work_activity_id,
    quantity: '1',
    unit: 'acre'
  });
  assert.equal(estimate.estimated_amount, 50);
  const before = list.rows[2];
  await assert.rejects(estateWrite(env, id, 'settlement-override', {
    labor_id: before.labor_id,
    work_date: day,
    component: 'work_earned',
    override_amount: 70,
    reason: '',
    preview_key: before.preview_key
  }, who), /reason/);
  await estateWrite(env, id, 'settlement-override', {
    labor_id: before.labor_id,
    work_date: day,
    component: 'work_earned',
    override_amount: 70,
    reason: 'Extra effort',
    preview_key: before.preview_key
  }, who);
  const changed = await estatePreview(env, id, before.labor_id, day);
  assert.equal(changed.total_earned, 170);
  assert.equal(changed.overrides[0].original_amount, 60);
  assert.equal(changed.overrides[0].created_by, who);
  assert.equal((await estateRates(env, id)).versions.find(r => r.category === 'work').payload.rates[2].rate, 60);
  await assert.rejects(estateWrite(env, id, 'pay-selected', {
    work_date: day,
    items: list.rows.map(r => ({
      labor_id: r.labor_id,
      preview_key: r.preview_key
    }))
  }, who), /inputs changed/);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM estate_salary_payment WHERE property_id=?').get(id).n, 0, 'Stale selection must not partially pay');
  const ready = (await estateDay(env, id, day)).rows;
  const paid = await estateWrite(env, id, 'pay-selected', {
    work_date: day,
    items: ready.map(r => ({
      labor_id: r.labor_id,
      preview_key: r.preview_key
    }))
  }, who);
  assert.equal(paid.total, 420);
  const frozen = db.prepare('SELECT snapshot_json FROM estate_salary_payment WHERE property_id=? ORDER BY payment_id').all(id);
  await saveRate('daily', '2027-01-01', '2027-12-31', {
    full_day: 1000,
    half_day: 500
  });
  db.prepare('UPDATE attendance SET attendance_value=.5 WHERE property_id=?').run(id);
  assert.throws(()=>db.prepare('UPDATE work_assignment SET work_quantity=100 WHERE property_id=?').run(id),/Completion is recorded/);
  db.prepare("UPDATE labors SET name='Changed name' WHERE labor_id=?").run(workers[0].labor_id);
  const history = await salaryReport(env, id, {
    from: '2026-09-01',
    to: '2026-09-30'
  });
  assert.deepEqual(history.rows.map(r => r.total_earned), [150, 120, 170]);
  assert.equal(history.rows[0].labor_name, 'Best Labour');
  assert.deepEqual(db.prepare('SELECT snapshot_json FROM estate_salary_payment WHERE property_id=? ORDER BY payment_id').all(id), frozen);
  assert.equal((await estatePreview(env, id, workers[0].labor_id, day)).total_earned, 150);
  await assert.rejects(estateWrite(env, id, 'settlement-input', {
    labor_id: workers[0].labor_id,
    work_date: day,
    quantity: 2,
    unit_id: unit
  }, who), /paid/);
  await assert.rejects(estateWrite(env, id, 'pay-selected', {
    work_date: day,
    items: ready.map(r => ({
      labor_id: r.labor_id,
      preview_key: r.preview_key
    }))
  }, who), /already paid/);
  assert.throws(() => db.prepare("UPDATE estate_salary_payment SET snapshot_json='{}' WHERE property_id=?").run(id), /immutable/);
  assert.equal(db.prepare('SELECT SUM(amount) n FROM estate_advance_recovery').get().n, 20);
  const oldDate = '2026-06-30';
  db.prepare("INSERT INTO attendance(labor_id,property_id,user_id,entry_date,attendance_value,created_by) VALUES(?,?,?,?,1,'Test')").run(workers[0].labor_id, id, p.user_id, oldDate);
  assert.equal((await estatePreview(env, id, workers[0].labor_id, oldDate)).fixed_earned, 80, 'June stays 80 after future rate versions');
  const other = workers[0].labor_id;
  await assert.rejects(estateWrite(env, 999999, 'settlement-input', {
    labor_id: other,
    work_date: day
  }, who), /estate owner/);
  const token = randomBytes(32).toString('hex');
  db.prepare("INSERT INTO auth_session(user_id,token_hash,expires_on) VALUES(?,?,datetime('now','+1 hour'))").run(p.user_id, createHash('sha256').update(token).digest('hex'));
  const headers = {
    'content-type': 'application/json',
    authorization: `Bearer ${token}`,
    'x-property-id': String(id)
  };
  const response = await onRequestGet({
    request: new Request('https://test/api/payroll/settlement-day?date=' + day, {
      headers
    }),
    env,
    params: {
      action: 'settlement-day'
    }
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).rows[0].total_earned, 150);
  const denied = await onRequestGet({
    request: new Request('https://test/api/payroll/rates', {
      headers: {
        ...headers,
        'x-property-id': '999999'
      }
    }),
    env,
    params: {
      action: 'rates'
    }
  });
  assert.notEqual(denied.status, 200);
  const post = await onRequestPost({
    request: new Request('https://test/api/payroll/rate-version', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        category: 'daily',
        effective_from: '2028-01-01',
        effective_to: '2028-12-31',
        payload: {
          full_day: 120,
          half_day: 60
        },
        created_by: 'Forged actor'
      })
    }),
    env,
    params: {
      action: 'rate-version'
    }
  });
  assert.equal(post.status, 201);
  assert.equal(db.prepare("SELECT created_by FROM estate_rate_version WHERE property_id=? AND effective_from='2028-01-01'").get(id).created_by, who);
  const summary = await financeOverview(env, id, null);
  assert.equal(summary.labour.earned, 440);
  assert.equal(summary.labour.paid, 420);
  const {
    createApp
  } = await import('../src/app.js');
  const {
    db: apiDb
  } = await import('../src/db.js');
  const server = createApp().listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const completionResponse=await fetch(origin+'/api/payroll/work-completion?date='+day,{headers});
    assert.equal(completionResponse.status,200);assert.equal((await completionResponse.json()).labours.length,3);
    const cloudCompletion=await onRequestGet({request:new Request('https://test/api/payroll/work-completion?date='+day,{headers}),env,params:{action:'work-completion'}});
    assert.equal(cloudCompletion.status,200);assert.equal((await cloudCompletion.json()).labours.length,3);
    const r = await fetch(origin + '/api/payroll/rates', {
      headers
    });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).versions.length, 7);
    const reportResponse = await fetch(origin + '/api/payroll/salary-report?from=2026-09-01&to=2026-09-30', {
      headers
    });
    assert.equal(reportResponse.status, 200);
    assert.equal((await reportResponse.json()).rows[0].total_earned, 150);
    const duplicate = await fetch(origin + '/api/payroll/rate-version', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        category: 'daily',
        effective_from: '2026-06-30',
        effective_to: '2026-07-01',
        payload: {
          full_day: 900,
          half_day: 450
        }
      })
    });
    assert.equal(duplicate.status, 409);
    const exceptionPost=await fetch(origin+'/api/payroll/labour-exception',{method:'POST',headers,body:JSON.stringify({labor_id:workers[0].labor_id,category:'daily',effective_from:'2029-01-01',effective_to:'2029-12-31',full_day:90,half_day:45,created_by:'Forged exception actor'})});
    assert.equal(exceptionPost.status,201);const exceptionId=(await exceptionPost.json()).id;assert.equal(db.prepare('SELECT created_by FROM labour_rate_exception WHERE exception_id=?').get(exceptionId).created_by,who);
    const contextResponse=await fetch(origin+'/api/payroll/rate-context?date=2026-09-20&category=daily',{headers});assert.equal(contextResponse.status,200);assert.equal((await contextResponse.json()).full_day,100);

  } finally {
    await new Promise(resolve => server.close(resolve));
    apiDb.close();
  }
  // Optional exceptions are component-specific and independently versioned.
  const customWorker = db.prepare("INSERT INTO labors(user_id,name) VALUES(?,'Custom worker') RETURNING *").get(p.user_id);
  const exceptionBody = {
    labor_id: customWorker.labor_id,
    category: 'daily',
    effective_from: '2026-01-01',
    effective_to: '2026-08-31',
    full_day: 60,
    half_day: 30
  };
  await estateWrite(env, id, 'labour-exception', exceptionBody, who);
  await estateWrite(env, id, 'labour-exception', {
    ...exceptionBody,
    effective_from: '2026-09-01',
    effective_to: '2026-12-31',
    full_day: 70,
    half_day: 35
  }, who);
  await estateWrite(env, id, 'labour-exception', {
    labor_id: customWorker.labor_id,
    category: 'work',
    type_id: activities[0].work_activity_id,
    rate: 40,
    unit: 'acre',
    effective_from: '2026-09-01',
    effective_to: '2026-12-31'
  }, who);
  await estateWrite(env, id, 'labour-exception', {
    labor_id: customWorker.labor_id,
    category: 'overtime',
    type_id: ot.id,
    rate: 180,
    effective_from: '2026-09-01',
    effective_to: '2026-12-31'
  }, who);
  const ex = (await estateRates(env, id)).exceptions;
  const custom = (d, changes = {}) => calculateEstateDay({
    day: d,
    attendance: 1,
    versions: setup.versions,
    exceptions: ex,
    propertyId: id,
    laborId: customWorker.labor_id,
    ...changes
  });
  const assigned = index => [{
    work_activity_id: activities[index].work_activity_id,
    work_activity_name: activities[index].work_activity_name,
    work_quantity: 1,
    work_unit: 'acre'
  }];
  assert.equal(custom(day, {
    assignments: assigned(0)
  }).total_earned, 110);
  assert.equal(custom(day, {
    assignments: assigned(1)
  }).total_earned, 90);
  assert.equal(custom(day, {
    input: {
      extras: [{
        overtime_type_id: ot.id,
        quantity: 1
      }]
    }
  }).overtime_earned, 180);
  assert.equal(custom(day, {
    laborId: workers[0].labor_id
  }).fixed_earned, 100);
  assert.equal(custom('2026-08-31').fixed_earned, 60);
  assert.equal(custom('2026-09-01').fixed_earned, 70);
  assert.equal(custom('2026-12-31').fixed_earned, 70);
  assert.equal(custom('2027-01-01', {
    versions: (await estateRates(env, id)).versions
  }).fixed_earned, 1000, 'Expired exception falls back');
  assert.equal(custom(day, {
    versions,
    input: {
      quantity: 9,
      unit_id: unit
    }
  }).fixed_earned, 70, 'Custom daily wage beats seasonal wage');
  assert.equal(custom(day, {
    versions,
    input: {
      quantity: 9,
      unit_id: unit
    }
  }).variable_earned, 50, 'Seasonal bonus remains estate-wide');
  assert.equal(custom(day).daily_rate_source, 'Custom Labour Rate');
  assert.equal(custom(day,{exceptions:[{...ex[0],category:'daily',type_id:0,full_day:99,half_day:49,effective_from:'2027-01-01',effective_to:'2027-12-31'}]}).fixed_earned,100,'Future exception must not apply today');
  assert.equal(custom(day, {
    assignments: assigned(0)
  }).work_charges[0].rate_source, 'Custom Labour Rate');
  assert.equal(custom(day, {
    assignments: assigned(1)
  }).work_charges[0].rate_source, 'Estate Rate');
  assert.equal(custom(day, {
    versions: []
  }).fixed_earned, 70, 'An explicit custom wage supplies a missing default');
  assert.throws(() => custom(day, {
    versions: [],
    assignments: assigned(1)
  }), /No active Weeding/);
  await assert.rejects(estateWrite(env, id, 'labour-exception', {
    ...exceptionBody,
    effective_from: '2026-08-31',
    effective_to: '2026-09-01'
  }, who), /overlap/);
  await assert.rejects(estateWrite(env, id, 'labour-exception', {
    ...exceptionBody,
    labor_id: workers[0].labor_id,
    effective_from: '2026-07-01',
    effective_to: '2026-12-31',
    full_day: 100,
    half_day: 50
  }, who), /No exception is needed/);
  assert.throws(() => db.prepare('UPDATE labour_rate_exception SET full_day=999 WHERE property_id=?').run(id), /immutable/);
  assert.throws(() => db.prepare('DELETE FROM labour_rate_exception WHERE property_id=?').run(id), /cannot be deleted/);
  const customEstimate = await assignmentEstimate(env, id, {
    date: day,
    labor_id: customWorker.labor_id,
    work_activity_id: activities[0].work_activity_id,
    quantity: '1',
    unit: 'acre'
  });
  assert.equal(customEstimate.estimated_amount, 40);
  assert.equal(customEstimate.rate_source, 'Custom Labour Rate');
  db.prepare("INSERT INTO attendance(labor_id,property_id,user_id,entry_date,attendance_value,created_by) VALUES(?,?,?,?,1,'Test')").run(customWorker.labor_id, id, p.user_id, day);
  db.prepare('INSERT INTO work_assignment(property_id,labor_id,work_date,work_activity_id,block_id,work_quantity,work_unit) VALUES(?,?,?,?,?,1,?)').run(id, customWorker.labor_id, day, activities[0].work_activity_id, newBlock.block_id, 'acre');
  const customCompletion=(await workCompletionDay(env,id,day)).labours.find(l=>l.labor_id===customWorker.labor_id);
  await saveWorkCompletion(env,id,{date:day,items:customCompletion.assignments.map(a=>({work_assignment_id:a.work_assignment_id,assignment_key:a.assignment_key,revision:a.revision,actual_quantity:1}))},who);
  const customPreview = await estatePreview(env, id, customWorker.labor_id, day);
  assert.equal(customPreview.total_earned, 110);
  await estateWrite(env, id, 'pay-selected', {
    work_date: day,
    items: [{
      labor_id: customWorker.labor_id,
      preview_key: customPreview.preview_key
    }]
  }, who);
  await estateWrite(env, id, 'labour-exception', {
    ...exceptionBody,
    effective_from: '2027-01-01',
    effective_to: '2027-12-31',
    full_day: 90,
    half_day: 45
  }, who);
  assert.equal((await estatePreview(env, id, customWorker.labor_id, day)).total_earned, 110);
  const customReport = (await salaryReport(env, id, {
    from: day,
    to: day
  })).rows.find(r => r.labor_id === customWorker.labor_id);
  assert.equal(customReport.total_earned, 110);
  assert.equal(customReport.daily_exception.full_day, 70);
  // A competing payment after preview must roll the entire new batch back.
  const raceDate = '2026-06-29';
  for (const w of workers.slice(0, 2)) db.prepare("INSERT INTO attendance(labor_id,property_id,user_id,entry_date,attendance_value,created_by) VALUES(?,?,?,?,1,'Test')").run(w.labor_id, id, p.user_id, raceDate);
  const racePreviews = await Promise.all(workers.slice(0, 2).map(w => estatePreview(env, id, w.labor_id, raceDate)));
  const racingEnv = {
    DB: {
      ...env.DB,
      batch: async statements => {
        const r = racePreviews[1];
        db.prepare('INSERT INTO estate_salary_payment(property_id,labor_id,work_date,payment_date,payment_method,earned,advances,payable,snapshot_json,paid_by) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id, r.labor_id, raceDate, day, 'cash', r.total_earned, r.advance_paid, r.settled_paid, JSON.stringify(r), who);
        return env.DB.batch(statements);
      }
    }
  };
  await assert.rejects(estateWrite(racingEnv, id, 'pay-selected', {
    work_date: raceDate,
    items: racePreviews.map(r => ({
      labor_id: r.labor_id,
      preview_key: r.preview_key
    }))
  }, who), /changed elsewhere/);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM estate_salary_payment WHERE property_id=? AND work_date=? AND labor_id=?').get(id, raceDate, workers[0].labor_id).n, 0, 'First payment must roll back if a later payment conflicts');
  console.log('PASS: estate rate versions, boundaries, overlap, acceptance 430/410, threshold bonus, regular/seasonal, OT, audited override, advances, atomic bulk pay, frozen reports and tenant scope.');
} finally {
  db.close();
  fs.rmSync(file, {
    force: true
  });
}
