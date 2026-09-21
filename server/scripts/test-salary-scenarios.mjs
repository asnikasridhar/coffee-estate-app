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
const file = path.join(os.tmpdir(), `salary-25-scenarios-${process.pid}.sqlite`);
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
  const preview=async(id,date)=>{await complete(id,date);return estatePreview(env,p,id,date);};
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

  attend(best,'2026-09-20');assign(best,'2026-09-20',fert);
  assert.equal((await preview(best,'2026-09-20')).total_earned,150);
  const estimate=await assignmentEstimate(env,p,{date:'2026-09-20',labor_id:best,work_activity_id:fert,quantity:1,unit:'acre'});
  assert.equal(estimate.estimated_amount,50);assert.equal(estimate.rate_source,'Estate Rate');
  await pay('2026-09-20',[best]);check(1,'Default wage + work = 150, paid snapshot');

  await exception(sundara,'daily',{full_day:70,half_day:35});
  attend(sundara,'2026-09-20');assign(sundara,'2026-09-20',weed);
  let r=await preview(sundara,'2026-09-20');assert.equal(r.total_earned,90);assert.equal(r.daily_rate_source,'Custom Labour Rate');assert.equal(r.work_charges[0].rate_source,'Estate Rate');check(2,'Daily exception independently falls back to estate work');
  await exception(sundara,'work',{type_id:fert,rate:40,unit:'acre'});
  attend(sundara,'2026-09-21');assign(sundara,'2026-09-21',fert,2);
  r=await preview(sundara,'2026-09-21');assert.equal(r.total_earned,150);assert.equal(r.work_charges[0].rate_source,'Custom Labour Rate');check(3,'Daily + work exceptions = 150');
  attend(sundara,'2026-09-22');assign(sundara,'2026-09-22',prune,10,'tree');assert.equal((await preview(sundara,'2026-09-22')).total_earned,220);check(4,'Other work falls back = 220');
  attend(sundara,'2026-09-23',.5);assert.equal((await preview(sundara,'2026-09-23')).total_earned,35);check(5,'Half-day custom wage = 35');
  attend(best,'2026-09-24');await input(best,'2026-09-24',{extras:[{overtime_type_id:ot,quantity:2}]});r=await preview(best,'2026-09-24');assert.equal(r.total_earned,300);assert.equal(r.extras[0].rate_source,'Estate Rate');check(6,'Estate OT = 300');
  await exception(testLabour,'overtime',{type_id:ot,rate:150});attend(testLabour,'2026-09-24');await input(testLabour,'2026-09-24',{extras:[{overtime_type_id:ot,quantity:2}]});r=await preview(testLabour,'2026-09-24');assert.equal(r.total_earned,400);assert.equal(r.extras[0].rate_source,'Custom Labour Rate');check(7,'Custom OT = 400');
  for(const [n,date,q,total] of [[8,'2026-10-10',5,260],[9,'2026-10-11',2,210],[10,'2026-10-12',3,260],[11,'2026-10-13',7,260]]) {
    attend(novan,date);assign(novan,date,harvest,1,'work');await input(novan,date,{quantity:q,unit_id:unit});r=await preview(novan,date);assert.equal(r.total_earned,total);assert.equal(r.daily_rate_source,'Seasonal Rate');check(n,`Seasonal harvest ${q}: ${total}`);
  }
  attend(novan,'2026-10-14');await input(novan,'2026-10-14',{use_regular:true});r=await preview(novan,'2026-10-14');assert.equal(r.total_earned,120);assert.equal(r.input.use_regular,true);check(12,'Explicit regular wage = 120');
  attend(sundara,'2026-10-15');assign(sundara,'2026-10-15',fert,2);await write('settlement-advance',{labor_id:sundara,work_date:'2026-10-15',amount:40,reason:'Personal'});r=await preview(sundara,'2026-10-15');assert.deepEqual([r.total_earned,r.advance_paid,r.settled_paid],[150,40,110]);await pay('2026-10-15',[sundara]);check(13,'Gross 150, advance 40, net 110');
  attend(best,'2026-10-16');assign(best,'2026-10-16',fert);await input(best,'2026-10-16',{use_regular:true});await override(best,'2026-10-16',70);r=await preview(best,'2026-10-16');assert.equal(r.total_earned,190);assert.equal(r.override_audit[0].original_amount,50);assert.equal((await assignmentEstimate(env,p,{date:'2026-10-17',labor_id:best,work_activity_id:fert,quantity:1,unit:'acre'})).estimated_amount,50);check(14,'Audited override, master work rate remains 50');
  for(const [id,extra] of [[best,20],[sundara,70],[novan,110]]) {attend(id,'2026-10-18');await input(id,'2026-10-18',{custom_amount:extra});}
  await pay('2026-10-18',[best,sundara]);let report=await salaryReport(env,p,{from:'2026-10-18',to:'2026-10-18'});assert.deepEqual(report.rows.map(x=>[x.labor_id,x.status,x.settled_paid]).sort((a,b)=>a[0]-b[0]),[[best,'paid',170],[sundara,'paid',140],[novan,'unpaid',260]]);check(15,'Selected paid 310, outstanding 260 in reports');
  await rate('daily','2027-01-01','2027-12-31',{full_day:200,half_day:100});await rate('work','2027-01-01','2027-12-31',{rates:workRates.map(w=>({...w,rate:100}))});r=(await salaryReport(env,p,{from:'2026-09-20',to:'2026-09-20'})).rows.find(x=>x.labor_id===best);assert.deepEqual([r.fixed_earned,r.work_earned,r.total_earned],[100,50,150]);check(16,'Historical paid wage unchanged by future rates');
  const boundary=worker('Sundara boundary fixture');await exception(boundary,'daily',{full_day:70,half_day:35,effective_to:'2026-09-30'});attend(boundary,'2026-10-05');assert.equal((await preview(boundary,'2026-10-05')).fixed_earned,150);check(17,'Expired exception falls back to seasonal');
  await exception(boundary,'daily',{full_day:90,half_day:45,effective_from:'2026-11-01',effective_to:'2026-11-30'});for(const [date,wage] of [['2026-10-20',150],['2026-11-01',90]]){attend(boundary,date);assert.equal((await preview(boundary,date)).fixed_earned,wage);}check(18,'Future exception only eligible from November 1');
  await exception(boundary,'work',{type_id:fert,rate:40,unit:'acre',effective_to:'2026-09-30'});await rate('work','2026-08-01','2026-08-31',{rates:workRates});for(const [date,value] of [['2026-08-31',50],['2026-09-01',40],['2026-09-30',40],['2026-10-01',50]]){assert.equal((await assignmentEstimate(env,p,{date,labor_id:boundary,work_activity_id:fert,quantity:1,unit:'acre'})).estimated_amount,value);}check(19,'Inclusive work exception boundaries');
  await assert.rejects(exception(boundary,'work',{type_id:fert,rate:45,unit:'acre',effective_from:'2026-09-15',effective_to:'2026-10-15'}),/overlap/i);check(20,'Overlapping exception rejected');
  attend(best,'2026-09-25');assign(best,'2026-09-25',pepper,1,'work');await complete(best,'2026-09-25');r=(await estateDay(env,p,'2026-09-25')).rows.find(x=>x.labor_id===best);assert.equal(r.status,'pending');assert.match(r.error,/Pepper Tying/);await assert.rejects(pay('2026-09-25',[best]),/Pepper Tying/);check(21,'Missing work rate blocks payment');
  attend(best,'2026-09-26');assign(best,'2026-09-26',fert);assign(best,'2026-09-26',weed,2);r=await preview(best,'2026-09-26');assert.equal(r.total_earned,190);assert.equal(r.work_charges.length,2);check(22,'Multiple work assignments = 190');
  attend(best,'2026-09-27',.5);assign(best,'2026-09-27',fert);await input(best,'2026-09-27',{extras:[{overtime_type_id:ot,quantity:1}]});assert.equal((await preview(best,'2026-09-27')).total_earned,200);check(23,'Half day + work + OT = 200');
  attend(sundara,'2026-10-19');await input(sundara,'2026-10-19',{quantity:5,unit_id:unit});r=await preview(sundara,'2026-10-19');assert.deepEqual([r.fixed_earned,r.variable_earned,r.daily_rate_source],[70,50,'Custom Labour Rate']);assert.ok(r.messages.some(m=>m.includes('takes priority')));check(24,'Confirmed custom-wage precedence; seasonal bonus still applies');
  // Attachment 25 assumes no active daily exception. Use a separate labour to keep that premise.
  const combined=worker('Sundara combined fixture');await exception(combined,'work',{type_id:fert,rate:40,unit:'acre'});attend(combined,'2026-10-20');assign(combined,'2026-10-20',fert,2);await input(combined,'2026-10-20',{extras:[{overtime_type_id:ot,quantity:1}]});await write('settlement-advance',{labor_id:combined,work_date:'2026-10-20',amount:50,reason:'Personal'});r=await preview(combined,'2026-10-20');assert.deepEqual([r.total_earned,r.advance_paid,r.settled_paid],[330,50,280]);await override(combined,'2026-10-20',100);await pay('2026-10-20',[combined]);
  const frozen=await preview(combined,'2026-10-20');assert.equal(frozen.status,'paid');assert.deepEqual([frozen.total_earned,frozen.advance_paid,frozen.settled_paid],[350,50,300]);
  await rate('overtime','2027-01-01','2027-12-31',{rates:[{overtime_type_id:ot,rate:999}]});await rate('seasonal','2027-01-01','2027-12-31',{name:'Future season',full_day:999,half_day:500,minimum_quantity:4,bonus_amount:999,unit_id:unit});
  assert.deepEqual(await preview(combined,'2026-10-20'),frozen);report=await salaryReport(env,p,{from:'2026-10-20',to:'2026-10-20'});report.rows=report.rows.filter(x=>x.labor_id===combined);r=report.rows[0];assert.deepEqual([r.total_earned,r.advance_paid,r.settled_paid],[350,50,300]);const html=salaryReportHtml(report,{});assert.match(html,/350\.00/);assert.match(html,/50\.00/);assert.match(html,/300\.00/);assert.match(html,/<td>350<\/td><td>50<\/td><td>300<\/td>/);check(25,'350 gross / 50 advance / 300 paid frozen in settlement, history, report and PDF HTML');
  // Regression for seasonal actuals: reject a mismatched unit without overwriting valid input.
  const wrong=db.prepare('SELECT baseunit_id FROM baseunit WHERE baseunit_id<>? LIMIT 1').get(unit);
  if(wrong){await assert.rejects(input(novan,'2026-10-10',{quantity:8,unit_id:wrong.baseunit_id}),/harvest unit/);assert.equal((await preview(novan,'2026-10-10')).quantity,5);}
  console.log('PASS: all 25 attachment scenarios and seasonal unit regression');
} finally {
  mock.timers.reset();
  db.close();
  fs.rmSync(file,{force:true});
}

