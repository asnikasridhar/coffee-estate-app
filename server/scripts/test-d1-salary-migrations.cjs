const fs=require('fs'),path=require('path'),Database=require('better-sqlite3');
const root=path.resolve(__dirname,'../..');
const source=new Database(path.join(root,'server/data/coffee-estate.sqlite'),{readonly:true}),db=new Database(':memory:');
db.pragma('foreign_keys = OFF'); // Schema-only parser fixture; no estate data is copied.
const files=['0025_estate_rate_versions.sql','0026_labour_rate_exceptions.sql'],sql=files.map(f=>fs.readFileSync(path.join(root,'migrations/d1',f),'utf8'));
const added=new Set(sql.flatMap(s=>[...s.matchAll(/CREATE TABLE (\w+)/g)].map(m=>m[1])));
for(const row of source.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all())if(!added.has(row.name))db.exec(row.sql);
for(let i=0;i<files.length;i++){require('node:assert/strict').equal(sql[i],fs.readFileSync(path.join(root,'migrations',files[i]),'utf8'));db.exec(sql[i]);console.log(files[i]+': fresh schema OK');}
db.prepare("INSERT INTO estate_rate_version(property_id,category,effective_from,effective_to,payload_json,created_by) VALUES(1,'daily','2026-01-01','2026-06-30','{}','test')").run();
let blocked=false;try{db.prepare("INSERT INTO estate_rate_version(property_id,category,effective_from,effective_to,payload_json,created_by) VALUES(1,'daily','2026-06-30','2026-07-31','{}','test')").run();}catch(e){blocked=/overlap/.test(e.message)}if(!blocked)throw new Error('Overlap guard failed');
db.prepare("INSERT INTO estate_rate_version(property_id,category,effective_from,effective_to,payload_json,created_by) VALUES(1,'daily','2026-07-01','2026-12-31','{}','test')").run();console.log('Overlap guard rejects collision and permits adjacent version');source.close();db.close();
