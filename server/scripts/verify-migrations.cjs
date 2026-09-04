const fs = require('fs');
const os = require('os');
const path = require('path');
const Database = require('better-sqlite3');

const root = path.resolve(__dirname, '..', '..');
const source = path.join(root, 'server', 'data', 'coffee-estate.sqlite');
const target = path.join(os.tmpdir(), 'coffee-estate-migration-verification.sqlite');
async function main() {
  fs.rmSync(target, { force: true });
  const sourceDb = new Database(source, { readonly: true });
  await sourceDb.backup(target);
  sourceDb.close();
  const db = new Database(target);
  try {
  const plantColumns=db.prepare('PRAGMA table_info(plantdetails)').all().map(column=>column.name);
  if (!plantColumns.includes('property_id')) db.exec(fs.readFileSync(path.join(root,'migrations','d1','0014_plant_property_and_variety.sql'),'utf8'));
  const inventoryColumns=db.prepare('PRAGMA table_info(plant_inventory)').all().map(column=>column.name);
  if (!inventoryColumns.includes('variety_master_id')) {
    for(const name of ['0015_crop_type_variety_hierarchy.sql','0016_inventory_variety_only.sql']){
      db.exec(fs.readFileSync(path.join(root,'migrations','d1',name),'utf8'));
    }
  }
  if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='fertilizer_purchase'").get()) {
    db.exec(fs.readFileSync(path.join(root, 'migrations', 'd1', '0017_fertilizer_management.sql'), 'utf8'));
  }
  if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='auth_session'").get()) db.exec(fs.readFileSync(path.join(root,'migrations','d1','0018_auth_sessions.sql'),'utf8'));
  if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type='view' AND name='fertilizer_stock_balance'").get()) db.exec(fs.readFileSync(path.join(root,'migrations','d1','0019_fertilizer_atomic_transactions.sql'),'utf8'));
  const operationalColumns=db.prepare('PRAGMA table_info(plant_inventory)').all().map(column=>column.name);
  if (!operationalColumns.includes('productive_count')) db.exec(fs.readFileSync(path.join(root,'migrations','d1','0020_plant_inventory_operational_fields.sql'),'utf8'));
  const userColumns=db.prepare('PRAGMA table_info(users)').all().map(column=>column.name);
  if (!userColumns.includes('email')) db.exec(fs.readFileSync(path.join(root,'migrations','d1','0021_estate_user_login.sql'),'utf8'));
  if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='finance_season'").get()) db.exec(fs.readFileSync(path.join(root,'migrations','d1','0022_finance_v1.sql'),'utf8'));
  const required = db.prepare("SELECT name FROM sqlite_master WHERE name IN ('auth_session','fertilizer_stock_balance','fertilizer_adjustment_bu','idx_plant_inventory_property_variety','finance_season','finance_sale','finance_wage_period','ux_finance_expense_source')").all();
  if (required.length !== 8) throw new Error(`Expected 8 migration objects, found ${required.length}`);
  const foreignKeys = db.pragma('foreign_key_check');
  if (foreignKeys.length) throw new Error(`Foreign-key violations: ${JSON.stringify(foreignKeys)}`);
  console.log('Migration verification passed:', required.map(item => item.name).sort().join(', '));
  } finally {
    db.close();
    fs.rmSync(target, { force: true });
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
