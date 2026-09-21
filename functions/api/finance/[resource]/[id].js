import { json, options, body, fail, withFinanceLog } from '../../../_shared/http.js';
import { financeContext, season, crop, yieldType, saveCommissionRule } from '../../../_shared/finance.js';
export function onRequestOptions(){return options();}
async function patchFinance({request,env,params}){try{const {propertyId}=await financeContext(request,env);const b=await body(request),id=Number(params.id),who=String(b.modified_by||'Owner').slice(0,80);
  if(params.resource==='wageRules')return json({error:'Historical wage rates are immutable. Use Set Rates to create a new dated version.'},409);
  if(b.action==='archive'){
    if(params.resource==='yieldTypes'){const owned=await env.DB.prepare(`SELECT fyt.finance_yield_type_id FROM finance_yield_type fyt JOIN variety_master vm ON vm.variety_master_id=fyt.variety_master_id JOIN crop_type_master ct ON ct.crop_type_id=vm.crop_type_id JOIN crop_master cm ON cm.crop_id=ct.crop_id WHERE fyt.finance_yield_type_id=? AND cm.property_id=?`).bind(id,propertyId).first();if(!owned)return json({error:'Record not found'},404);await env.DB.prepare(`UPDATE finance_yield_type SET status='archived',modified_on=CURRENT_TIMESTAMP,modified_by=? WHERE finance_yield_type_id=?`).bind(who,id).run();return json({ok:true,status:'archived'});}
    const map={seasons:['finance_season','season_id',true],cycles:['finance_settlement_cycle','settlement_cycle_id',true],wageRules:['finance_wage_rule','wage_rule_id',true],commissionRules:['finance_vendor_commission_rule','vendor_commission_rule_id',true],marketRates:['finance_market_rate','market_rate_id',false],buyerOffers:['finance_buyer_offer','buyer_offer_id',false]},cfg=map[params.resource];if(!cfg)return json({error:'This record cannot be archived here'},400);const sql=cfg[2]?`UPDATE ${cfg[0]} SET status='archived',modified_on=CURRENT_TIMESTAMP,modified_by=? WHERE ${cfg[1]}=? AND property_id=?`:`UPDATE ${cfg[0]} SET status='archived' WHERE ${cfg[1]}=? AND property_id=?`;const result=await env.DB.prepare(sql).bind(...(cfg[2]?[who,id,propertyId]:[id,propertyId])).run();return result.meta.changes?json({ok:true,status:'archived'}):json({error:'Record not found'},404);
  }
  if(!b.action&&['seasons','cycles','wageRules','commissionRules','yieldTypes','marketRates','buyerOffers'].includes(params.resource)){
    if(b.season_id)await season(env,propertyId,b.season_id);let stmt,values;
    if(params.resource==='seasons'){await crop(env,propertyId,b.crop_id);stmt=`UPDATE finance_season SET crop_id=?,season_name=?,start_date=?,end_date=?,status=?,modified_on=CURRENT_TIMESTAMP,modified_by=? WHERE season_id=? AND property_id=?`;values=[b.crop_id,b.season_name,b.start_date,b.end_date,b.status||'planned',who,id,propertyId];}
    else if(params.resource==='cycles'){stmt=`UPDATE finance_settlement_cycle SET cycle_name=?,frequency=?,custom_days=?,effective_from=?,effective_to=?,status=?,modified_on=CURRENT_TIMESTAMP,modified_by=? WHERE settlement_cycle_id=? AND property_id=?`;values=[b.cycle_name,b.frequency,b.custom_days||null,b.effective_from,b.effective_to||null,b.status||'active',who,id,propertyId];}
    else if(params.resource==='wageRules'){stmt=`UPDATE finance_wage_rule SET season_id=?,labor_id=?,settlement_cycle_id=?,effective_from=?,effective_to=?,fixed_rate=?,fixed_basis=?,variable_rate=?,variable_unit_id=?,overtime_rate=?,status=?,modified_on=CURRENT_TIMESTAMP,modified_by=? WHERE wage_rule_id=? AND property_id=?`;values=[b.season_id||null,b.labor_id,b.settlement_cycle_id||null,b.effective_from,b.effective_to||null,Number(b.fixed_rate||0),b.fixed_basis||'day',Number(b.variable_rate||0),b.variable_unit_id||null,Number(b.overtime_rate||0),b.status||'active',who,id,propertyId];}
    else if(params.resource==='commissionRules'){await saveCommissionRule(env,propertyId,b,who,id);return json({ok:true,id});}
    else if(params.resource==='yieldTypes'){await crop(env,propertyId,b.crop_id);stmt=`UPDATE finance_yield_type SET variety_master_id=?,yield_type_name=?,default_unit_id=?,status=?,modified_on=CURRENT_TIMESTAMP,modified_by=? WHERE finance_yield_type_id=? AND EXISTS(SELECT 1 FROM variety_master vm JOIN crop_type_master ct ON ct.crop_type_id=vm.crop_type_id JOIN crop_master cm ON cm.crop_id=ct.crop_id WHERE vm.variety_master_id=? AND cm.property_id=? AND cm.crop_id=?)`;values=[b.variety_master_id,b.yield_type_name,b.default_unit_id,b.status||'active',who,id,b.variety_master_id,propertyId,b.crop_id];}
    else {await crop(env,propertyId,b.crop_id);await yieldType(env,b.crop_id,b.variety_master_id,b.finance_yield_type_id);const market=params.resource==='marketRates';stmt=market?`UPDATE finance_market_rate SET season_id=?,crop_id=?,variety_master_id=?,finance_yield_type_id=?,effective_date=?,rate=?,unit_id=?,source_name=?,notes=?,status=? WHERE market_rate_id=? AND property_id=?`:`UPDATE finance_buyer_offer SET season_id=?,crop_id=?,variety_master_id=?,finance_yield_type_id=?,buyer_id=?,market_rate_id=?,offered_rate=?,unit_id=?,offer_date=?,valid_until=?,notes=?,status=? WHERE buyer_offer_id=? AND property_id=?`;values=market?[b.season_id||null,b.crop_id,b.variety_master_id,b.finance_yield_type_id,b.effective_date,Number(b.rate),b.unit_id,b.source_name||null,b.notes||null,b.status||'active',id,propertyId]:[b.season_id||null,b.crop_id,b.variety_master_id,b.finance_yield_type_id,b.buyer_id,b.market_rate_id||null,Number(b.offered_rate),b.unit_id,b.offer_date,b.valid_until||null,b.notes||null,b.status||'active',id,propertyId];}
    const result=await env.DB.prepare(stmt).bind(...values).run();return result.meta.changes?json({ok:true,id}):json({error:'Record not found'},404);
  }
  if(params.resource==='wagePeriods'&&b.action==='finalize'){
    const period=await env.DB.prepare(`SELECT * FROM finance_wage_period WHERE wage_period_id=? AND property_id=? AND status='draft'`).bind(id,propertyId).first();if(!period)return json({error:'Draft wage period not found'},404);
    const type=await env.DB.prepare(`SELECT expensetype_id FROM expensetype WHERE expense_code='LABOUR'`).first();
    await env.DB.batch([
      env.DB.prepare(`INSERT OR IGNORE INTO running_expenses(expensetype_id,property_id,season_id,expense_code,expense_occurence_date,other_expense,description,payment_status,source_type,source_id,status,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(type.expensetype_id,propertyId,period.season_id,'Labour settlement',period.period_end,period.total_earned,`Labour earning period ${period.period_start} to ${period.period_end}`,period.outstanding_balance>0?'partial':'paid','wage_period',id,'confirmed',who),
      env.DB.prepare(`UPDATE finance_wage_period SET status=?,expense_id=(SELECT expense_id FROM running_expenses WHERE source_type='wage_period' AND source_id=?),modified_on=CURRENT_TIMESTAMP,modified_by=? WHERE wage_period_id=? AND property_id=?`).bind(period.outstanding_balance>0?'finalized':'paid',id,who,id,propertyId)
    ]);return json({ok:true});
  }
  if(params.resource==='vendorPeriods'&&b.action==='finalize'){
    const period=await env.DB.prepare(`SELECT * FROM finance_vendor_period WHERE vendor_period_id=? AND property_id=? AND status='draft'`).bind(id,propertyId).first();if(!period)return json({error:'Draft vendor period not found'},404);const type=await env.DB.prepare(`SELECT expensetype_id FROM expensetype WHERE expense_code='VENDOR-COMMISSION'`).first();
    await env.DB.batch([env.DB.prepare(`INSERT OR IGNORE INTO running_expenses(expensetype_id,property_id,season_id,expense_code,expense_occurence_date,other_expense,description,payment_status,source_type,source_id,status,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(type.expensetype_id,propertyId,period.season_id,'Vendor commission',period.period_end,period.commission_earned,`Vendor commission period ${period.period_start} to ${period.period_end}`,period.outstanding_balance>0?'partial':'paid','vendor_period',id,'confirmed',who),env.DB.prepare(`UPDATE finance_vendor_period SET status=?,expense_id=(SELECT expense_id FROM running_expenses WHERE source_type='vendor_period' AND source_id=?),modified_on=CURRENT_TIMESTAMP,modified_by=? WHERE vendor_period_id=? AND property_id=?`).bind(period.outstanding_balance>0?'finalized':'paid',id,who,id,propertyId)]);return json({ok:true});
  }
  const map={expenses:['running_expenses','expense_id','modified_date'],harvests:['finance_harvest','harvest_id','modified_on'],sales:['finance_sale','sale_id','modified_on']};const cfg=map[params.resource];if(cfg&&['cancel','reverse'].includes(b.action)){const status=b.action==='reverse'?'reversed':'cancelled';const result=await env.DB.prepare(`UPDATE ${cfg[0]} SET status=?,${cfg[2]}=CURRENT_TIMESTAMP,modified_by=? WHERE ${cfg[1]}=? AND property_id=? AND status IN ('draft','confirmed')`).bind(status,who,id,propertyId).run();return result.meta.changes?json({ok:true,status}):json({error:'Active record not found'},404);}
  return json({error:'Unsupported finance action'},400);
}catch(err){return fail(err,'Finance update failed');}}
export async function onRequestPatch(ctx){return withFinanceLog(ctx,'update',()=>patchFinance(ctx));}

async function deleteFinance({request,env,params}){
  try{
    const {propertyId}=await financeContext(request,env),id=Number(params.id);
    if(params.resource==='wageRules')return json({error:'Historical wage rates cannot be deleted.'},409);
    const map={
      seasons:['finance_season','season_id'],
      cycles:['finance_settlement_cycle','settlement_cycle_id'],
      wageRules:['finance_wage_rule','wage_rule_id'],
      commissionRules:['finance_vendor_commission_rule','vendor_commission_rule_id'],
      marketRates:['finance_market_rate','market_rate_id'],
      buyerOffers:['finance_buyer_offer','buyer_offer_id']
    };
    if(params.resource==='yieldTypes'){
      const owned=await env.DB.prepare(`SELECT fyt.finance_yield_type_id FROM finance_yield_type fyt JOIN variety_master vm ON vm.variety_master_id=fyt.variety_master_id JOIN crop_type_master ct ON ct.crop_type_id=vm.crop_type_id JOIN crop_master cm ON cm.crop_id=ct.crop_id WHERE fyt.finance_yield_type_id=? AND cm.property_id=?`).bind(id,propertyId).first();
      if(!owned)return json({error:'Record not found'},404);
      await env.DB.prepare(`DELETE FROM finance_yield_type WHERE finance_yield_type_id=?`).bind(id).run();
      return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*'}});
    }
    const cfg=map[params.resource];
    if(!cfg)return json({error:'This finance record cannot be deleted'},400);
    const result=await env.DB.prepare(`DELETE FROM ${cfg[0]} WHERE ${cfg[1]}=? AND property_id=?`).bind(id,propertyId).run();
    return result.meta.changes?new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*'}}):json({error:'Record not found'},404);
  }catch(err){return fail(err,'Finance delete failed');}
}
export async function onRequestDelete(ctx){return withFinanceLog(ctx,'delete',()=>deleteFinance(ctx));}
