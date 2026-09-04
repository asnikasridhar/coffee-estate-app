import { json, options, body, fail } from '../../../_shared/http.js';
import { financeContext } from '../../../_shared/finance.js';
export function onRequestOptions(){return options();}
export async function onRequestPatch({request,env,params}){try{const {propertyId}=await financeContext(request,env);const b=await body(request),id=Number(params.id),who=String(b.modified_by||'Owner').slice(0,80);
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
