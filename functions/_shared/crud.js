import { all, first, body, json, propertyIdFromUrl, userIdFromRequest, assertPropertyAccess } from './http.js';

export const resources = {
  properties: { table: 'property', id: 'property_id', order: 'property_name', propertyMode: 'owner', allowed: ['property_name','total_acre','address_1','address_2','pincode','user_id','created_by','modified_by'] },
  blocks: { table: 'blocks', id: 'block_id', order: 'block_name', propertyMode: 'direct', allowed: ['block_name','block_area','property_id','parent_block_id'] },
  labors: { table: 'labors', id: 'labor_id', order: 'name', propertyMode: 'ownerColumn', ownerColumn:'user_id', allowed: ['user_id','name','age','adhar_card','bank_details','health_history','photo','address','emergency_details','created_by','modified_by'] },
  employees: { table: 'labors', id: 'labor_id', order: 'name', propertyMode: 'ownerColumn', ownerColumn:'user_id', allowed: ['user_id','name','age','adhar_card','bank_details','health_history','photo','address','emergency_details','created_by','modified_by'] },
  vendors: { table: 'vendor', id: 'vendor_id', order: 'vendorname', propertyMode: 'ownerColumn', ownerColumn:'user_id', allowed: ['user_id','vendorname','description','created_by','modified_by'] },
  laborVendors: { table: 'laborvendor', id: 'laborvendor_id', order: 'laborvendor_id DESC', propertyMode: 'viaLaborOwner', allowed: ['labor_id','vendor_id','vendor_labor_percentage','laborvendorcode','created_by','modified_by'] },
  vendorSettlements: { table: 'laborvendor_settlement', id: 'laborvendor_settlement_id', order: 'running_wage_transaction_date DESC', propertyMode: 'global', allowed: ['laborvendor_id','settled_amount','advance_amount','running_wage_transaction_date','created_by','modified_by'] },
  wages: { table: 'wage', id: 'wage_id', order: 'wage_id DESC', propertyMode: 'global', allowed: ['wage_fixed','wage_variable','wage_fix_code','wage_ot_perhr_price','labor_id','created_by','modified_by'] },
  wageSettlements: { table: 'wage_settlement', id: 'running_wage_id', order: 'running_wage_transaction_date DESC', propertyMode: 'global', allowed: ['wage_id','settled_amount','advance_amount','running_wage_transaction_date','created_by','modified_by'] },
  plants: { table: 'plantdetails', id: 'plant_id', order: 'plant_type', propertyMode: 'direct', allowed: ['property_id','plant_type','plantdetailscol','details','block_id','created_by','modified_by'] },
  crops: { table: 'crop_master', id: 'crop_id', order: 'crop_name', propertyMode: 'direct', allowed: ['crop_name','property_id','created_by','modified_by'] },
  cropTypes: { table: 'crop_type_master', id: 'crop_type_id', order: 'type_name', propertyMode: 'viaCropMaster', allowed: ['crop_id','type_name','block_id','created_by','modified_by'] },
  varieties: { table: 'variety_master', id: 'variety_master_id', order: 'variety_name', propertyMode: 'viaCropType', allowed: ['variety_id','crop_type_id','variety_name','created_by','modified_by'] },
  plantInventory: { table: 'plant_inventory', id: 'plant_inventory_id', order: 'plant_inventory_id DESC', propertyMode: 'direct', allowed: ['property_id','block_id','sub_block_name','variety_master_id','plant_count','planting_date','spacing','area_covered','area_unit_id','productive_count','non_productive_count','dead_count','status','notes','created_by','modified_by'] },
  workActivities: { table: 'work_activity', id: 'work_activity_id', order: 'work_activity_name', propertyMode: 'direct', allowed: ['property_id','work_activity_name','work_activity_type','notes','created_by','modified_by'] },
  workAssignments: { table: 'work_assignment', id: 'work_assignment_id', order: 'work_date DESC, work_assignment_id DESC', propertyMode: 'direct', allowed: ['property_id','work_activity_id','labor_id','work_date','block_id','notes','created_by','modified_by'] },
  yieldTypes: { table: 'yieldtype', id: 'yieldtype_id', order: 'yieldtype_name', propertyMode: 'viaPlant', allowed: ['yieldtype_name','plant_id','created_by','modified_by'] },
  yieldRates: { table: 'yieldrate', id: 'yieldrate_id', order: 'yieldrate_id DESC', propertyMode: 'viaPlant', allowed: ['plant_id','yieldtype_id','yieldrate_code','yieldrate_running_rate','baseunit_id','created_by','modified_by'] },
  assets: { table: 'currentasset', id: 'currentasset_id', order: 'asset_name', propertyMode: 'direct', allowed: ['asset_name','asset_price','procured_year','isactive','property_id','asset_procured_source','created_by','modified_by'] },
  inventory: { table: 'currentasset', id: 'currentasset_id', order: 'asset_name', propertyMode: 'direct', allowed: ['asset_name','asset_price','procured_year','isactive','property_id','asset_procured_source','created_by','modified_by'] },
  expenseTypes: { table: 'expensetype', id: 'expensetype_id', order: 'expense_name', propertyMode: 'global', allowed: ['expense_code','expense_name','current_rate','baseunit_id','created_by','modified_by'] },
  expenses: { table: 'running_expenses', id: 'expense_id', order: 'expense_occurence_date DESC', propertyMode: 'direct', allowed: ['expensetype_id','property_id','expense_code','expense_occurence_date','other_expense','created_by','modified_by'] },
  cropDetails: { table: 'cropdetails', id: 'crop_id', order: 'crop_id DESC', propertyMode: 'direct', allowed: ['yield_obtained','selling_price','property_id','other_detail','created_by','modified_by'] },
  cropIncome: { table: 'crop_income', id: 'income_id', order: 'received_date DESC', propertyMode: 'viaCrop', allowed: ['crop_id','income_amount','received_date','created_by','modified_by'] },
  income: { table: 'crop_income', id: 'income_id', order: 'received_date DESC', propertyMode: 'viaCrop', allowed: ['crop_id','income_amount','received_date','created_by','modified_by'] },
  fertilizers: { table: 'fertilizers', id: 'fertilizer_id', order: 'date_of_application DESC', propertyMode: 'direct', allowed: ['fertilizer_name','date_of_application','property_id','other_details','created_by','modified_by'] },
  fertilizerMasters: { table: 'fertilizer_master', id: 'fertilizer_master_id', order: 'fertilizer_name', propertyMode: 'global', allowed: ['fertilizer_name','grade','category','purchase_unit_id','base_unit_id','package_size','conversion_to_base','minimum_stock_base','is_active','notes','created_by','modified_by'] },
  fertilizerPurchases: { table: 'fertilizer_purchase', id: 'fertilizer_purchase_id', order: 'purchase_date DESC, fertilizer_purchase_id DESC', propertyMode: 'direct', allowed: ['property_id','fertilizer_master_id','supplier_id','purchase_date','invoice_number','quantity','unit_id','quantity_base','rate_per_unit','total_amount','payment_status','payment_mode','create_expense','notes','created_by','modified_by'] },
  fertilizerApplications: { table: 'fertilizer_application', id: 'fertilizer_application_id', order: 'application_date DESC, fertilizer_application_id DESC', propertyMode: 'direct', allowed: ['property_id','fertilizer_master_id','block_id','sub_block_name','variety_master_id','application_date','application_method','quantity','unit_id','quantity_base','work_assignment_id','notes','created_by','modified_by'] },
  fertilizerAdjustments: { table: 'fertilizer_adjustment', id: 'fertilizer_adjustment_id', order: 'adjustment_date DESC, fertilizer_adjustment_id DESC', propertyMode: 'direct', allowed: ['property_id','fertilizer_master_id','adjustment_date','adjustment_type','direction','quantity','unit_id','quantity_base','reason','notes','created_by','modified_by'] },
  fertilizerMovements: { table: 'fertilizer_stock_movement', id: 'fertilizer_stock_movement_id', order: 'movement_date DESC, fertilizer_stock_movement_id DESC', propertyMode: 'direct', allowed: ['property_id','fertilizer_master_id','movement_date','direction','movement_type','quantity_base','reference_type','reference_id','notes','created_by'] },
  fertilizerStock: { table: 'fertilizer_stock_balance', id: 'fertilizer_master_id', order: 'fertilizer_master_id', propertyMode: 'direct', allowed: [] },
  reports: { table: 'reports', id: 'report_id', order: 'report_id DESC', propertyMode: 'direct', allowed: ['total_expenditure','total_revenue','profit_loss','property_id','created_by','modified_by'] },
  baseUnits: { table: 'baseunit', id: 'baseunit_id', order: 'baseunit_name', propertyMode: 'global', allowed: ['baseunit_name','created_by','modified_by'] }
};

function pick(obj, allowed) { const o = {}; for (const k of allowed) if (Object.prototype.hasOwnProperty.call(obj, k)) o[k] = obj[k]; return o; }
function normalizePayload(resource, payload) {
  if (resource === 'blocks' && payload.parent_block_id === '') {
    return { ...payload, parent_block_id: null };
  }
  return payload;
}
async function normalizeBusinessPayload(env, resource, payload) {
  if (!['fertilizerPurchases','fertilizerApplications','fertilizerAdjustments'].includes(resource)) return payload;
  const master = await first(env, 'SELECT fertilizer_master_id,purchase_unit_id,base_unit_id,conversion_to_base FROM fertilizer_master WHERE fertilizer_master_id=? AND is_active=1', Number(payload.fertilizer_master_id));
  if (!master) throw Object.assign(new Error('Select an active fertilizer'), { status: 400 });
  const quantity = Number(payload.quantity);
  const unitId = Number(payload.unit_id);
  if (!(quantity > 0)) throw Object.assign(new Error('Quantity must be greater than zero'), { status: 400 });
  if (![Number(master.purchase_unit_id), Number(master.base_unit_id)].includes(unitId)) throw Object.assign(new Error('Unit is not valid for the selected fertilizer'), { status: 400 });
  const factor = unitId === Number(master.base_unit_id) ? 1 : Number(master.conversion_to_base || 1);
  const result = { ...payload, quantity, unit_id: unitId, quantity_base: Number((quantity * factor).toFixed(4)) };
  if (resource === 'fertilizerPurchases') result.total_amount = Number((quantity * Number(payload.rate_per_unit || 0)).toFixed(2));
  return result;
}
function applyProperty(resource, payload, propertyId, userId) {
  if (resource === 'properties') return { ...payload, user_id: payload.user_id || userId };
  if (['blocks','plants','crops','plantInventory','workActivities','workAssignments','assets','inventory','expenses','cropDetails','fertilizers','fertilizerPurchases','fertilizerApplications','fertilizerAdjustments','fertilizerMovements','reports'].includes(resource)) return { ...payload, property_id: Number(payload.property_id || propertyId) };
  return payload;
}
export async function listResource(request, env, resource) {
  const cfg = resources[resource]; if (!cfg) return json({ error: 'Unknown resource' }, 404);
  const userId = await userIdFromRequest(request,env); const propertyId = propertyIdFromUrl(request);
  if (propertyId) await assertPropertyAccess(env, userId, propertyId);
  const base = `SELECT * FROM ${cfg.table}`;
  if (resource === 'properties') return json(await all(env, `${base} WHERE user_id = ? ORDER BY ${cfg.order} LIMIT 500`, userId));
  if (cfg.propertyMode === 'ownerColumn') return json(await all(env, `${base} WHERE ${cfg.ownerColumn} = ? ORDER BY ${cfg.order} LIMIT 500`, userId));
  if (cfg.propertyMode === 'viaLaborOwner') return json(await all(env, `${base} WHERE labor_id IN (SELECT labor_id FROM labors WHERE user_id = ?) ORDER BY ${cfg.order} LIMIT 500`, userId));
  if (cfg.propertyMode === 'global') return json(await all(env, `${base} ORDER BY ${cfg.order} LIMIT 500`));
  if (!propertyId && cfg.propertyMode === 'direct') return json({error:'Select a property first'},400);
  if (cfg.propertyMode === 'direct') return json(await all(env, `${base} WHERE property_id = ? ORDER BY ${cfg.order} LIMIT 500`, propertyId));
  if (cfg.propertyMode === 'viaBlock') return json(await all(env, `${base} WHERE block_id IN (SELECT block_id FROM blocks WHERE property_id = ?) ORDER BY ${cfg.order} LIMIT 500`, propertyId));
  if (cfg.propertyMode === 'viaPlant') return json(await all(env, `${base} WHERE plant_id IN (SELECT pd.plant_id FROM plantdetails pd WHERE pd.property_id = ?) ORDER BY ${cfg.order} LIMIT 500`, propertyId));
  if (cfg.propertyMode === 'viaCropMaster') return json(await all(env, `${base} WHERE crop_id IN (SELECT crop_id FROM crop_master WHERE property_id = ?) ORDER BY ${cfg.order} LIMIT 500`, propertyId));
  if (cfg.propertyMode === 'viaCropType') return json(await all(env, `${base} WHERE crop_type_id IN (SELECT ct.crop_type_id FROM crop_type_master ct JOIN crop_master c ON c.crop_id=ct.crop_id WHERE c.property_id = ?) ORDER BY ${cfg.order} LIMIT 500`, propertyId));
  if (cfg.propertyMode === 'viaCrop') return json(await all(env, `${base} WHERE crop_id IN (SELECT crop_id FROM cropdetails WHERE property_id = ?) ORDER BY ${cfg.order} LIMIT 500`, propertyId));
  return json(await all(env, `${base} ORDER BY ${cfg.order} LIMIT 500`));
}
export async function createResource(request, env, resource) {
  const cfg = resources[resource]; if (!cfg) return json({ error: 'Unknown resource' }, 404);
  const userId = await userIdFromRequest(request,env); const propertyId = propertyIdFromUrl(request);
  if (propertyId) await assertPropertyAccess(env, userId, propertyId);
  const b = await body(request);
  const picked = pick(b, cfg.allowed);
  if (cfg.allowed.includes('created_by')) picked.created_by = b.created_by || 'Admin';
  let payload = normalizePayload(resource, applyProperty(resource, picked, propertyId, userId));
  if (payload.property_id) await assertPropertyAccess(env, userId, payload.property_id);
  if (cfg.propertyMode === 'ownerColumn') payload[cfg.ownerColumn] = userId;
  if (cfg.propertyMode === 'viaLaborOwner') {
    const labor = await first(env, 'SELECT labor_id FROM labors WHERE labor_id=? AND user_id=?', payload.labor_id, userId);
    const vendor = await first(env, 'SELECT vendor_id FROM vendor WHERE vendor_id=? AND user_id=?', payload.vendor_id, userId);
    if (!labor || !vendor) throw Object.assign(new Error('Select a labourer and vendor belonging to this account'), { status: 400 });
  }
  payload = await normalizeBusinessPayload(env, resource, payload);
  const cols = Object.keys(payload).filter(k => payload[k] !== undefined);
  if (!cols.length) return json({ error: 'No valid fields supplied' }, 400);
  const placeholders = cols.map(() => '?').join(',');
  const r = await env.DB.prepare(`INSERT INTO ${cfg.table} (${cols.join(',')}) VALUES (${placeholders})`).bind(...cols.map(c => payload[c])).run();
  const created = await first(env, `SELECT * FROM ${cfg.table} WHERE ${cfg.id} = ?`, r.meta.last_row_id);
  return json(created, 201);
}


export async function updateResource(request, env, resource, id) {
  const cfg = resources[resource]; if (!cfg) return json({ error: 'Unknown resource' }, 404);
  const userId = await userIdFromRequest(request,env); const propertyId = propertyIdFromUrl(request);
  if (propertyId) await assertPropertyAccess(env, userId, propertyId);
  const existing = await authorizedRecord(env,cfg,id,userId,propertyId);
  if (!existing) return json({error:'Record not found'},404);
  const b = await body(request);
  const picked = pick(b, cfg.allowed);
  if (cfg.allowed.includes('modified_by')) picked.modified_by = b.modified_by || 'Admin';
  let payload = normalizePayload(resource, applyProperty(resource, picked, propertyId, userId));
  if (payload.property_id) await assertPropertyAccess(env, userId, payload.property_id);
  if(cfg.propertyMode==='ownerColumn') payload[cfg.ownerColumn]=userId;
  const normalizedBusiness = await normalizeBusinessPayload(env, resource, { ...existing, ...payload });
  if (['fertilizerPurchases','fertilizerApplications','fertilizerAdjustments'].includes(resource)) {
    payload.quantity = normalizedBusiness.quantity;
    payload.unit_id = normalizedBusiness.unit_id;
    payload.quantity_base = normalizedBusiness.quantity_base;
    if (resource === 'fertilizerPurchases') payload.total_amount = normalizedBusiness.total_amount;
  }
  const cols = Object.keys(payload).filter(k => payload[k] !== undefined && k !== cfg.id);
  if (!cols.length) return json({ error: 'No valid fields supplied' }, 400);
  await env.DB.prepare(`UPDATE ${cfg.table} SET ${cols.map(c => `${c} = ?`).join(', ')} WHERE ${cfg.id} = ?`).bind(...cols.map(c => payload[c]), id).run();
  const updated = await first(env, `SELECT * FROM ${cfg.table} WHERE ${cfg.id} = ?`, id);
  return json(updated);
}

export async function deleteResource(request, env, resource, id) {
  const cfg = resources[resource]; if (!cfg) return json({ error: 'Unknown resource' }, 404);
  const userId = await userIdFromRequest(request,env); const propertyId = propertyIdFromUrl(request);
  if (propertyId) await assertPropertyAccess(env, userId, propertyId);
  const existing = await authorizedRecord(env,cfg,id,userId,propertyId);
  if (!existing) return json({error:'Record not found'},404);
  await env.DB.prepare(`DELETE FROM ${cfg.table} WHERE ${cfg.id} = ?`).bind(id).run();
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
}

async function authorizedRecord(env,cfg,id,userId,propertyId){
  if(cfg.propertyMode==='owner')return first(env,`SELECT ${cfg.id} FROM ${cfg.table} WHERE ${cfg.id}=? AND user_id=?`,id,userId);
  if(cfg.propertyMode==='ownerColumn')return first(env,`SELECT ${cfg.id} FROM ${cfg.table} WHERE ${cfg.id}=? AND ${cfg.ownerColumn}=?`,id,userId);
  if(cfg.propertyMode==='viaLaborOwner')return first(env,`SELECT lv.* FROM ${cfg.table} lv JOIN labors l ON l.labor_id=lv.labor_id WHERE lv.${cfg.id}=? AND l.user_id=?`,id,userId);
  if(cfg.propertyMode==='direct'){
    if(!propertyId)return null;
    return first(env,`SELECT * FROM ${cfg.table} WHERE ${cfg.id}=? AND property_id=?`,id,propertyId);
  }
  if(cfg.propertyMode==='viaCropMaster')return first(env,`SELECT t.${cfg.id} FROM ${cfg.table} t JOIN crop_master c ON c.crop_id=t.crop_id JOIN property p ON p.property_id=c.property_id WHERE t.${cfg.id}=? AND p.user_id=?`,id,userId);
  if(cfg.propertyMode==='viaCropType')return first(env,`SELECT t.${cfg.id} FROM ${cfg.table} t JOIN crop_type_master ct ON ct.crop_type_id=t.crop_type_id JOIN crop_master c ON c.crop_id=ct.crop_id JOIN property p ON p.property_id=c.property_id WHERE t.${cfg.id}=? AND p.user_id=?`,id,userId);
  return null;
}
