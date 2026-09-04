const path=require('path');
const Database=require('better-sqlite3');
const db=new Database(path.resolve(__dirname,'..','data','coffee-estate.sqlite'),{readonly:true});
const objects=db.prepare("SELECT name,type FROM sqlite_master WHERE name LIKE 'finance_%' OR name LIKE 'fertilizer_%' ORDER BY name").all();
const expenseColumns=db.prepare('PRAGMA table_info(running_expenses)').all().map(item=>item.name);
const prerequisites=['plant_inventory','crop_master','crop_type_master','variety_master','auth_session'].map(name=>({name,exists:Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name))}));
console.log(JSON.stringify({objects,expenseColumns,prerequisites},null,2));
db.close();
