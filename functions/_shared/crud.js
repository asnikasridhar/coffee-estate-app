import { all, first, body, json, propertyIdFromUrl, userIdFromRequest, assertPropertyAccess } from './http.js';

export const resources = {
  properties: { table: 'property', id: 'property_id', order: 'property_name', propertyMode: 'owner', allowed: ['property_name','total_acre','address_1','address_2','pincode','user_id','created_by','modified_by'] },
  blocks: { table: 'blocks', id: 'block_id', order: 'block_name', propertyMode: 'direct', allowed: ['block_name','block_area','property_id','parent_block_id'] },
  labors: { table: 'labors', id: 'labor_id', order: 'name', propertyMode: 'global', allowed: ['user_id','name','age','adhar_card','bank_details','health_history','photo','address','emergency_details','created_by','modified_by'] },
  employees: { table: 'labors', id: 'labor_id', order: 'name', propertyMode: 'global', allowed: ['user_id','name','age','adhar_card','bank_details','health_history','photo','address','emergency_details','created_by','modified_by'] },
  vendors: { table: 'vendor', id: 'vendor_id', order: 'vendorname', propertyMode: 'global', allowed: ['vendorname','description','created_by','modified_by'] },
  laborVendors: { table: 'laborvendor', id: 'laborvendor_id', order: 'laborvendor_id DESC', propertyMode: 'global', allowed: ['labor_id','vendor_id','vendor_labor_percentage','laborvendorcode','created_by','modified_by'] },
  vendorSettlements: { table: 'laborvendor_settlement', id: 'laborvendor_settlement_id', order: 'running_wage_transaction_date DESC', propertyMode: 'global', allowed: ['laborvendor_id','settled_amount','advance_amount','running_wage_transaction_date','created_by','modified_by'] },
  wages: { table: 'wage', id: 'wage_id', order: 'wage_id DESC', propertyMode: 'global', allowed: ['wage_fixed','wage_variable','wage_fix_code','wage_ot_perhr_price','labor_id','created_by','modified_by'] },
  wageSettlements: { table: 'wage_settlement', id: 'running_wage_id', order: 'running_wage_transaction_date DESC', propertyMode: 'global', allowed: ['wage_id','settled_amount','advance_amount','running_wage_transaction_date','created_by','modified_by'] },
  plants: { table: 'plantdetails', id: 'plant_id', order: 'plant_type', propertyMode: 'viaBlock', allowed: ['plant_type','details','block_id','plantdetailscol','created_by','modified_by'] },
  plantInventory: { table: 'plant_inventory', id: 'plant_inventory_id', order: 'plant_inventory_id DESC', propertyMode: 'direct', allowed: ['property_id','block_id','sub_block_name','plant_id','plant_count','planting_date','notes','created_by','modified_by'] },
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
  reports: { table: 'reports', id: 'report_id', order: 'report_id DESC', propertyMode: 'direct', allowed: ['total_expenditure','total_revenue','profit_loss','property_id','created_by','modified_by'] },
  baseUnits: { table: 'baseunit', id: 'baseunit_id', order: 'baseunit_name', propertyMode: 'global', allowed: ['baseunit_name','created_by','modified_by'] }
};

function pick(obj, allowed) { const o = {}; for (const k of allowed) if (Object.prototype.hasOwnProperty.call(obj, k)) o[k] = obj[k]; return o; }
function applyProperty(resource, payload, propertyId, userId) {
  if (resource === 'properties') return { ...payload, user_id: payload.user_id || userId };
  if (['blocks','assets','inventory','expenses','cropDetails','fertilizers','reports','plantInventory'].includes(resource)) return { ...payload, property_id: Number(payload.property_id || propertyId) };
  return payload;
}
export async function listResource(request, env, resource) {
  const cfg = resources[resource]; if (!cfg) return json({ error: 'Unknown resource' }, 404);
  const userId = userIdFromRequest(request); const propertyId = propertyIdFromUrl(request);
  if (propertyId) await assertPropertyAccess(env, userId, propertyId);
  const base = `SELECT * FROM ${cfg.table}`;
  if (resource === 'properties') return json(await all(env, `${base} WHERE user_id = ? ORDER BY ${cfg.order} LIMIT 500`, userId));
  if (!propertyId || cfg.propertyMode === 'global') return json(await all(env, `${base} ORDER BY ${cfg.order} LIMIT 500`));
  if (cfg.propertyMode === 'direct') return json(await all(env, `${base} WHERE property_id = ? ORDER BY ${cfg.order} LIMIT 500`, propertyId));
  if (cfg.propertyMode === 'viaBlock') return json(await all(env, `${base} WHERE block_id IN (SELECT block_id FROM blocks WHERE property_id = ?) ORDER BY ${cfg.order} LIMIT 500`, propertyId));
  if (cfg.propertyMode === 'viaPlant') return json(await all(env, `${base} WHERE plant_id IN (SELECT pd.plant_id FROM plantdetails pd JOIN blocks b ON b.block_id = pd.block_id WHERE b.property_id = ?) ORDER BY ${cfg.order} LIMIT 500`, propertyId));
  if (cfg.propertyMode === 'viaCrop') return json(await all(env, `${base} WHERE crop_id IN (SELECT crop_id FROM cropdetails WHERE property_id = ?) ORDER BY ${cfg.order} LIMIT 500`, propertyId));
  return json(await all(env, `${base} ORDER BY ${cfg.order} LIMIT 500`));
}
export async function createResource(request, env, resource) {
  const cfg = resources[resource]; if (!cfg) return json({ error: 'Unknown resource' }, 404);
  const userId = userIdFromRequest(request); const propertyId = propertyIdFromUrl(request);
  if (propertyId) await assertPropertyAccess(env, userId, propertyId);
  const b = await body(request);
  let payload = applyProperty(resource, { ...pick(b, cfg.allowed), created_by: b.created_by || 'Admin' }, propertyId, userId);
  const cols = Object.keys(payload).filter(k => payload[k] !== undefined);
  if (!cols.length) return json({ error: 'No valid fields supplied' }, 400);
  const placeholders = cols.map(() => '?').join(',');
  const r = await env.DB.prepare(`INSERT INTO ${cfg.table} (${cols.join(',')}) VALUES (${placeholders})`).bind(...cols.map(c => payload[c])).run();
  const created = await first(env, `SELECT * FROM ${cfg.table} WHERE ${cfg.id} = ?`, r.meta.last_row_id);
  return json(created, 201);
}
