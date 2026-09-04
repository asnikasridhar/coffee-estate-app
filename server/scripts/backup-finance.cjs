const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const root = path.resolve(__dirname, '..', '..');
const source = path.join(root, 'server', 'data', 'coffee-estate.sqlite');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.join(root, 'DB_Backup', `coffee-estate-before-finance-${stamp}.sqlite`);
fs.mkdirSync(path.dirname(target), { recursive: true });
const db = new Database(source, { readonly: true });
db.backup(target).then(() => {
  db.close();
  console.log(target);
}).catch(error => { db.close(); console.error(error); process.exitCode = 1; });
