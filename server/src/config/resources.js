export const resources = {
  properties: { table: 'property', id: 'property_id', order: 'property_name', propertyMode: 'owner', allowed: ['property_name','total_acre','address_1','address_2','pincode','user_id','created_by','modified_by'] },
  blocks: { table: 'blocks', id: 'block_id', order: 'block_name', propertyMode: 'direct', allowed: ['block_name','block_area','property_id','parent_block_id'] },
  labors: { table: 'labors', id: 'labor_id', order: 'name', propertyMode: 'ownerColumn', ownerColumn:'user_id', allowed: ['user_id','name','age','adhar_card','bank_details','health_history','photo','address','emergency_details','created_by','modified_by'] },
  vendors: { table: 'vendor', id: 'vendor_id', order: 'vendorname', propertyMode: 'ownerColumn', ownerColumn:'user_id', allowed: ['user_id','vendorname','description','created_by','modified_by'] },
  laborVendors: { table: 'laborvendor', id: 'laborvendor_id', order: 'laborvendor_id DESC', propertyMode: 'global', allowed: ['labor_id','vendor_id','vendor_labor_percentage','laborvendorcode','created_by','modified_by'] },
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
  expenseTypes: { table: 'expensetype', id: 'expensetype_id', order: 'expense_name', propertyMode: 'global', allowed: ['expense_code','expense_name','current_rate','baseunit_id','created_by','modified_by'] },
  expenses: { table: 'running_expenses', id: 'expense_id', order: 'expense_occurence_date DESC', propertyMode: 'direct', allowed: ['expensetype_id','property_id','expense_code','expense_occurence_date','other_expense','created_by','modified_by'] },
  cropDetails: { table: 'cropdetails', id: 'crop_id', order: 'crop_id DESC', propertyMode: 'direct', allowed: ['yield_obtained','selling_price','property_id','other_detail','created_by','modified_by'] },
  cropIncome: { table: 'crop_income', id: 'income_id', order: 'received_date DESC', propertyMode: 'viaCrop', allowed: ['crop_id','income_amount','received_date','created_by','modified_by'] },
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

export function applyProperty(resource, payload, propertyId) {
  if (['blocks','plants','crops','plantInventory','workActivities','workAssignments','assets','expenses','cropDetails','fertilizers','fertilizerPurchases','fertilizerApplications','fertilizerAdjustments','fertilizerMovements','reports'].includes(resource)) {
    return { ...payload, property_id: Number(payload.property_id || propertyId) };
  }
  return payload;
}
