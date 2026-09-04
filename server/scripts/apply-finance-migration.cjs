const fs=require('fs');
const path=require('path');
const Database=require('better-sqlite3');
const root=path.resolve(__dirname,'..','..');
const db=new Database(path.join(root,'server','data','coffee-estate.sqlite'));
db.pragma('foreign_keys=ON');
const sql=fs.readFileSync(path.join(root,'migrations','0022_finance_v1.sql'),'utf8');
try{
  if(!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='finance_season'").get()) db.exec(sql);
  else if(!db.prepare("SELECT 1 FROM sqlite_master WHERE type='trigger' AND name='fertilizer_purchase_ai'").get()) db.exec(sql.slice(sql.indexOf('DROP TRIGGER IF EXISTS fertilizer_purchase_ai;')));
  const violations=db.pragma('foreign_key_check');
  if(violations.length)throw new Error(`Foreign-key violations: ${JSON.stringify(violations)}`);
  console.log('Finance migration applied and verified.');
}finally{db.close();}
