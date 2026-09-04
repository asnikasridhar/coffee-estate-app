import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import Database from 'better-sqlite3';

const source=path.resolve('data','coffee-estate.sqlite');
const target=path.join(os.tmpdir(),`javaterrain-finance-test-${process.pid}.sqlite`);
const sourceDb=new Database(source,{readonly:true}); await sourceDb.backup(target); sourceDb.close();
process.env.DATABASE_FILE=target;
const {db}=await import('../src/db.js');
const {createApp}=await import('../src/app.js');
const owner=db.prepare(`SELECT u.user_id,p.property_id FROM users u JOIN property p ON p.user_id=u.user_id WHERE COALESCE(u.is_active,1)=1 ORDER BY u.user_id LIMIT 1`).get();
if(!owner)throw new Error('A property owner is required for API tests');
const token=randomBytes(32).toString('hex'),hash=createHash('sha256').update(token).digest('hex');
db.prepare(`INSERT INTO auth_session(user_id,token_hash,expires_on) VALUES(?,?,datetime('now','+1 hour'))`).run(owner.user_id,hash);
const server=createApp().listen(0); await new Promise(resolve=>server.once('listening',resolve));
const port=server.address().port,base=`http://127.0.0.1:${port}/api/finance`,headers={'content-type':'application/json',authorization:`Bearer ${token}`,'x-property-id':String(owner.property_id)};
async function call(route,options={}){const response=await fetch(base+route,{...options,headers:{...headers,...options.headers}});const text=await response.text();const value=text?JSON.parse(text):null;if(!response.ok)throw new Error(`${options.method||'GET'} ${route}: ${response.status} ${text}`);return value;}
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
try{
  const setup=await call('/setup'); assert(Array.isArray(setup.seasons),'Setup response missing seasons');
  const crop=db.prepare('SELECT crop_id FROM crop_master WHERE property_id=? LIMIT 1').get(owner.property_id); const variety=db.prepare(`SELECT vm.variety_master_id FROM variety_master vm JOIN crop_type_master ct ON ct.crop_type_id=vm.crop_type_id JOIN crop_master cm ON cm.crop_id=ct.crop_id WHERE cm.property_id=? LIMIT 1`).get(owner.property_id); const unit=db.prepare('SELECT baseunit_id FROM baseunit ORDER BY baseunit_id LIMIT 1').get(); const buyer=db.prepare('SELECT vendor_id FROM vendor WHERE user_id=? LIMIT 1').get(owner.user_id);
  if(!crop||!variety||!unit||!buyer)throw new Error('Crop, variety, unit and buyer fixtures are required');
  const tag=`Finance API ${Date.now()}`; const season=await call('/seasons',{method:'POST',body:JSON.stringify({crop_id:crop.crop_id,season_name:tag,start_date:'2026-01-01',end_date:'2026-12-31',status:'active'})});
  const cherry=await call('/yieldTypes',{method:'POST',body:JSON.stringify({crop_id:crop.crop_id,variety_master_id:variety.variety_master_id,yield_type_name:`Cherry ${Date.now()}`,default_unit_id:unit.baseunit_id})});
  const parchment=await call('/yieldTypes',{method:'POST',body:JSON.stringify({crop_id:crop.crop_id,variety_master_id:variety.variety_master_id,yield_type_name:`Parchment ${Date.now()}`,default_unit_id:unit.baseunit_id})});
  await call('/marketRates',{method:'POST',body:JSON.stringify({season_id:season.id,crop_id:crop.crop_id,variety_master_id:variety.variety_master_id,finance_yield_type_id:cherry.id,effective_date:'2026-09-01',rate:100,unit_id:unit.baseunit_id,source_name:'Test market'})});
  let summary=await call(`/overview?seasonId=${season.id}`); assert(summary.revenue===0,'Market rate incorrectly created revenue');
  await call('/harvests',{method:'POST',body:JSON.stringify({season_id:season.id,crop_id:crop.crop_id,variety_master_id:variety.variety_master_id,finance_yield_type_id:cherry.id,quantity:100,unit_id:unit.baseunit_id,harvest_date:'2026-09-01'})});
  await call('/sales',{method:'POST',body:JSON.stringify({season_id:season.id,crop_id:crop.crop_id,variety_master_id:variety.variety_master_id,finance_yield_type_id:parchment.id,buyer_id:buyer.vendor_id,quantity:10,unit_id:unit.baseunit_id,actual_rate:90,sale_date:'2026-09-02'})});
  summary=await call(`/overview?seasonId=${season.id}`); assert(summary.revenue===900,'Actual sale revenue is not quantity x actual rate'); const cherryStock=summary.stock.find(x=>x.finance_yield_type_id===cherry.id),parchmentStock=summary.stock.find(x=>x.finance_yield_type_id===parchment.id); assert(cherryStock?.available===100&&parchmentStock?.available===-10,'Yield forms were incorrectly netted together');
  const assigned=db.prepare(`SELECT pl.labor_id FROM propertylabor pl WHERE pl.property_id=? LIMIT 1`).get(owner.property_id);
  if(assigned){const rule=await call('/wageRules',{method:'POST',body:JSON.stringify({season_id:season.id,labor_id:assigned.labor_id,effective_from:'2026-09-01',fixed_rate:500,fixed_basis:'day',variable_rate:0,overtime_rate:0})});const period=await call('/wagePeriods',{method:'POST',body:JSON.stringify({season_id:season.id,labor_id:assigned.labor_id,wage_rule_id:rule.id,period_start:'2026-09-01',period_end:'2026-09-07',fixed_earned:1000,total_earned:1000,advance_paid:200,settled_paid:500})});await call(`/wagePeriods/${period.id}`,{method:'PATCH',body:JSON.stringify({action:'finalize'})});let duplicateRejected=false;try{await call(`/wagePeriods/${period.id}`,{method:'PATCH',body:JSON.stringify({action:'finalize'})})}catch{duplicateRejected=true}assert(duplicateRejected,'Duplicate finalization was accepted');const count=db.prepare(`SELECT COUNT(*) count FROM running_expenses WHERE source_type='wage_period' AND source_id=?`).get(period.id).count;assert(count===1,'Wage period produced duplicate expenses');summary=await call(`/overview?seasonId=${season.id}`);assert(summary.labour.earned===1000&&summary.labour.advance===200&&summary.labour.paid===500&&summary.labour.outstanding===300,'Wage reconciliation failed');}
  const unauthorized=await fetch(`${base}/setup`,{headers:{...headers,'x-property-id':'999999'}});assert(unauthorized.status===400,'Property scope was not enforced');
  console.log(JSON.stringify({passed:true,revenue:summary.revenue,gain:summary.gain,stock:summary.stock,labour:summary.labour},null,2));
}finally{await new Promise(resolve=>server.close(resolve));db.close();fs.rmSync(target,{force:true});}
