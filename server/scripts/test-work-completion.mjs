import fs from 'node:fs';
import { mock } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { d1Adapter } from '../src/utils/d1Adapter.js';
import { workCompletionDay, saveWorkCompletion, estateRates, estateWrite, estatePreview, estateDay, salaryReport, assignmentEstimate } from '../../functions/_shared/estateSalary.js';
import { salaryReportHtml } from '../../mobile/salaryReportHtml.js';

// All writes go to an isolated backup, never the working or remote database.
const file = path.join(os.tmpdir(), `work-completion-${process.pid}.sqlite`);
const source = new Database(path.resolve('data/coffee-estate.sqlite'), { readonly: true });
await source.backup(file);
source.close();
const db = new Database(file);
mock.timers.enable({apis:['Date'],now:new Date('2028-01-01T06:00:00Z')});
db.pragma('foreign_keys = ON');
try {
  for (const [table, migration] of [['payroll_daily','0023_labour_payroll.sql'],['payroll_rule_options','0024_salary_simple_flow.sql'],['estate_rate_version','0025_estate_rate_versions.sql'],['labour_rate_exception','0026_labour_rate_exceptions.sql'],['work_completion','0027_work_completion.sql']]) {
    if (!db.prepare('SELECT 1 FROM sqlite_master WHERE name=?').get(table)) db.exec(fs.readFileSync(`../migrations/${migration}`, 'utf8'));
  }
  const owner = db.prepare('SELECT * FROM property LIMIT 1').get();
  const property = db.prepare("INSERT INTO property(user_id,property_name) VALUES(?,'Attachment salary scenarios') RETURNING *").get(owner.user_id);
  const p = property.property_id, who = String(owner.user_id), env = d1Adapter(db);
  const unit = db.prepare("SELECT baseunit_id FROM baseunit WHERE lower(baseunit_name) IN ('bushel','bushels','bushal','bushals') LIMIT 1").get().baseunit_id;
  const worker = name => db.prepare('INSERT INTO labors(user_id,name) VALUES(?,?) RETURNING labor_id').get(owner.user_id, name).labor_id;
  const best = worker('Best Labour'), sundara = worker('Sundara'), novan = worker('Novan'), testLabour = worker('Test Labour');
  const activity = name => db.prepare('INSERT INTO work_activity(property_id,work_activity_name) VALUES(?,?) RETURNING work_activity_id').get(p, name).work_activity_id;
  const fert = activity('Fertilization'), weed = activity('Weeding'), prune = activity('Pruning'), harvest = activity('Harvesting'), pepper = activity('Pepper Tying');
  const oldBlock = db.prepare('SELECT * FROM blocks WHERE property_id=? LIMIT 1').get(owner.property_id);
  const blockData = {...oldBlock, property_id:p, block_name:'Test block'};
  delete blockData.block_id;
  const cols=Object.keys(blockData);
  const block=db.prepare(`INSERT INTO blocks(${cols.join(',')}) VALUES(${cols.map(()=>'?').join(',')}) RETURNING block_id`).get(...Object.values(blockData)).block_id;
  const write=(action,b)=>estateWrite(env,p,action,b,who);
  const rate=(category,from,to,payload)=>write('rate-version',{category,effective_from:from,effective_to:to,payload});
  const attend=(id,date,fraction=1)=>db.prepare('INSERT INTO attendance(labor_id,property_id,user_id,entry_date,attendance_value,created_by) VALUES(?,?,?,?,?,?)').run(id,p,owner.user_id,date,fraction,who);
  const assign=(id,date,type,quantity=1,workUnit='acre')=>db.prepare('INSERT INTO work_assignment(property_id,labor_id,work_date,work_activity_id,block_id,work_quantity,work_unit) VALUES(?,?,?,?,?,?,?)').run(p,id,date,type,block,quantity,workUnit === 'work' ? null : workUnit);
  const input=async(id,date,b={})=>{const result=await write('settlement-input',{labor_id:id,work_date:date,...b});await complete(id,date,b.quantity);return result;};
  const complete=async(id,date,harvestQuantity)=>{
    const list=await workCompletionDay(env,p,date),labor=list.labours.find(l=>l.labor_id===id);
    const items=(labor?.assignments || []).filter(a=>a.actual_quantity===null || (a.is_harvest && harvestQuantity!=null)).map(a=>({work_assignment_id:a.work_assignment_id,assignment_key:a.assignment_key,revision:a.revision,actual_quantity:a.is_harvest && harvestQuantity!=null?harvestQuantity:a.assigned_quantity??1}));
    if(items.length)await saveWorkCompletion(env,p,{date,items},who);
  };
  const preview=(id,date)=>estatePreview(env,p,id,date);
  const exception=(id,category,b={})=>write('labour-exception',{labor_id:id,category,effective_from:'2026-09-01',effective_to:'2026-12-31',...b});
  const pay=async (date,ids)=>write('pay-selected',{work_date:date,payment_date:date,payment_method:'cash',items:await Promise.all(ids.map(async id=>({labor_id:id,preview_key:(await preview(id,date)).preview_key})))});
  const override=async(id,date,value)=>write('settlement-override',{labor_id:id,work_date:date,component:'work_earned',override_amount:value,reason:'Difficult terrain',preview_key:(await preview(id,date)).preview_key});
  const check=(n,title)=>console.log(`PASS ${n}: ${title}`);
  await rate('daily','2026-09-01','2026-09-30',{full_day:100,half_day:50});
  await rate('daily','2026-10-01','2026-12-31',{full_day:120,half_day:60});
  const workRates=[{work_activity_id:fert,unit:'acre',rate:50},{work_activity_id:weed,unit:'acre',rate:20},{work_activity_id:prune,unit:'tree',rate:15},{work_activity_id:harvest,unit:'work',rate:60}];
  await rate('work','2026-09-01','2026-12-31',{rates:workRates});
  const ot=(await write('overtime-type',{name:'Overtime',unit:'hour'})).id;
  const transport=(await write('overtime-type',{name:'Transport Work',unit:'trip'})).id;
  await rate('overtime','2026-09-01','2026-12-31',{rates:[{overtime_type_id:ot,rate:100},{overtime_type_id:transport,rate:80}]});
  await rate('seasonal','2026-10-01','2026-12-31',{name:'Coffee Harvest 2026',full_day:150,half_day:75,minimum_quantity:3,bonus_amount:50,unit_id:unit});

  await rate('seasonal','2026-09-01','2026-09-30',{name:'September harvest',full_day:120,half_day:60,minimum_quantity:3,bonus_amount:50,unit_id:unit});
  const day='2026-09-21';
  for(const id of [best,sundara,novan])attend(id,day);
  assign(best,day,fert,2);assign(best,day,weed,1);assign(sundara,day,prune,10,'tree');assign(novan,day,harvest,null,null);
  let list=await workCompletionDay(env,p,day);
  assert.equal(list.labours.length,3);assert.equal(list.summary.pending,3);
  assert.equal(list.labours.find(l=>l.labor_id===best).assignments.length,2);
  assert.ok(list.labours.flatMap(l=>l.assignments).every(a=>a.actual_quantity===null));
  const bestRows=list.labours.find(l=>l.labor_id===best).assignments;
  assert.equal(bestRows[0].assigned_quantity,2);
  const harvestRow=list.labours.find(l=>l.labor_id===novan).assignments[0];
  assert.equal((await assignmentEstimate(env,p,{date:day,labor_id:novan,work_activity_id:harvest})).input_unit,'bushel');
  assert.equal(harvestRow.assigned_quantity,null);assert.equal(harvestRow.unit,'bushal');
  await assert.rejects(preview(best,day),/completion pending/);
  const item=(row,value)=>({work_assignment_id:row.work_assignment_id,assignment_key:row.assignment_key,revision:row.revision,actual_quantity:value});
  await saveWorkCompletion(env,p,{date:day,items:[item(bestRows[0],1),item(bestRows[1],0),item(harvestRow,5)]},who);
  list=await workCompletionDay(env,p,day);assert.equal(list.summary.completed,2);assert.equal(list.summary.pending,1);
  assert.equal(list.labours.find(l=>l.labor_id===best).assignments[1].actual_quantity,0);
  await write('settlement-advance',{labor_id:best,work_date:day,amount:20,reason:'Personal'});
  let result=await preview(best,day);
  assert.deepEqual([result.fixed_earned,result.work_earned,result.total_earned,result.advance_paid,result.settled_paid],[120,50,170,20,150]);
  assert.equal(result.work_charges[0].quantity,1);assert.equal(result.work_charges[1].amount,0);
  assert.equal(db.prepare('SELECT work_quantity FROM work_assignment WHERE work_assignment_id=?').get(bestRows[0].work_assignment_id).work_quantity,2);
  result=await preview(novan,day);assert.deepEqual([result.fixed_earned,result.work_earned,result.variable_earned,result.total_earned],[120,60,50,230]);
  console.log('PASS: grouped single-list completion, blank vs zero, assigned 2 / actual 1, 170 gross / 20 advance / 150 net, automatic harvest bonus');

  // One invalid last entry leaves every prior row untouched.
  const freshBest=list.labours.find(l=>l.labor_id===best).assignments[0];
  const pruning=list.labours.find(l=>l.labor_id===sundara).assignments[0];
  await assert.rejects(saveWorkCompletion(env,p,{date:day,items:[item(freshBest,2),item(pruning,-1)]},who),/non-negative/);
  assert.equal((await preview(best,day)).work_earned,50);
  // A second device changes a completion after validation: the revision trigger rolls back the batch.
  const originalBatch=env.DB.batch;
  env.DB.batch=async statements=>{
    db.prepare('UPDATE work_completion SET revision=revision+1 WHERE work_assignment_id=?').run(freshBest.work_assignment_id);
    return originalBatch(statements);
  };
  await assert.rejects(saveWorkCompletion(env,p,{date:day,items:[item(pruning,10),item(freshBest,2)]},who),/changed elsewhere/);
  env.DB.batch=originalBatch;
  assert.equal(db.prepare('SELECT 1 FROM work_completion WHERE work_assignment_id=?').get(pruning.work_assignment_id),undefined);
  await assert.rejects(saveWorkCompletion(env,p,{date:day,items:[item(freshBest,1)]},who),/changed elsewhere/);
  console.log('PASS: validation, concurrent update protection and atomic rollback');

  list=await workCompletionDay(env,p,day);
  const current=list.labours.find(l=>l.labor_id===best).assignments[0];
  await assert.rejects(saveWorkCompletion(env,p,{date:day,items:[{...item(current,1),rate_override:70}]},who),/reason/);
  await saveWorkCompletion(env,p,{date:day,items:[{...item(current,1),rate_override:70,reason:'Difficult area',notes:'Slope'}]},who);
  result=await preview(best,day);assert.equal(result.work_earned,70);assert.equal(result.work_charges[0].rate_source,'Settlement Override');
  assert.equal(result.work_charges[0].completion.reason,'Difficult area');
  const labor=list.labours.find(l=>l.labor_id===best);
  await saveWorkCompletion(env,p,{date:day,items:[],labour_extras:[{labor_id:best,input_key:labor.input_key,extras:[{overtime_type_id:ot,quantity:2}]}]},who);
  assert.equal((await preview(best,day)).overtime_earned,200);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM work_completion_audit WHERE work_assignment_id=?').get(current.work_assignment_id).n,3);
  console.log('PASS: optional work-rate exception with reason and automatic OT');
  env.DB.batch=async statements=>{
    db.prepare('UPDATE work_completion SET actual_quantity=2,revision=revision+1 WHERE work_assignment_id=?').run(current.work_assignment_id);
    return originalBatch(statements);
  };
  await assert.rejects(pay(day,[best]),/completion changed/i);
  env.DB.batch=originalBatch;
  assert.equal(db.prepare('SELECT 1 FROM estate_salary_payment WHERE property_id=? AND labor_id=? AND work_date=?').get(p,best,day),undefined);
  await pay(day,[best]);
  const paid=await preview(best,day);
  await assert.rejects(saveWorkCompletion(env,p,{date:day,items:[item(current,9)]},who),/paid/);
  assert.throws(()=>db.prepare('UPDATE work_completion SET actual_quantity=9,revision=revision+1 WHERE work_assignment_id=?').run(current.work_assignment_id),/paid/);
  assert.throws(()=>db.prepare('UPDATE work_assignment SET work_quantity=9 WHERE work_assignment_id=?').run(current.work_assignment_id),/Completion is recorded/);
  assert.throws(()=>assign(best,day,prune,1,'tree'),/paid/);
  await rate('daily','2028-01-01','2028-12-31',{full_day:999,half_day:500});
  assert.deepEqual(await preview(best,day),paid);
  assert.deepEqual((await salaryReport(env,p,{from:day,to:day})).rows.find(r=>r.labor_id===best).work_charges,paid.work_charges);
  console.log('PASS: paid completion locks and frozen report snapshots');
  // Fixed work supports Done and confirmed no-work without a meaningless numeric entry.
  const fixed=activity('Transport fixed');
  await rate('work','2028-01-01','2028-12-31',{rates:[{work_activity_id:fixed,rate:80,unit:'work'}]});
  attend(sundara,'2028-01-01');assign(sundara,'2028-01-01',fixed,null,null);
  let fixedRow=(await workCompletionDay(env,p,'2028-01-01')).labours[0].assignments[0];assert.equal(fixedRow.fixed,true);
  await saveWorkCompletion(env,p,{date:'2028-01-01',items:[item(fixedRow,0)]},who);assert.equal((await preview(sundara,'2028-01-01')).work_earned,0);
  fixedRow=(await workCompletionDay(env,p,'2028-01-01')).labours[0].assignments[0];
  await saveWorkCompletion(env,p,{date:'2028-01-01',items:[item(fixedRow,1)]},who);assert.equal((await preview(sundara,'2028-01-01')).work_earned,80);
  const foreign=worker('Foreign assignment fixture');
  await assert.rejects(saveWorkCompletion(env,p,{date:day,items:[{work_assignment_id:999999,actual_quantity:1}]},who),/Invalid/);
  console.log('PASS: fixed Done/zero and unknown assignment rejected');
} finally {
  mock.timers.reset();db.close();fs.rmSync(file,{force:true});
}
