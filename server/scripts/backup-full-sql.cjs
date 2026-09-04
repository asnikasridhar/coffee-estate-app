const fs = require('fs');
const os = require('os');
const path = require('path');
const Database = require('better-sqlite3');

const root = path.resolve(__dirname, '..', '..');
const source = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'server', 'data', 'coffee-estate.sqlite');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(root, 'DB_Backup', `coffee-estate-full-${stamp}.sql`);

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}
function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (Buffer.isBuffer(value)) return `X'${value.toString('hex')}'`;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'NULL';
    return String(value);
  }
  if (typeof value === 'bigint') return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

fs.mkdirSync(path.dirname(target), { recursive: true });
const db = new Database(source, { readonly: true, fileMustExist: true });
db.pragma('query_only = ON');

const dump = db.transaction(() => {
  const tables = db.prepare(`SELECT name, sql FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL
    ORDER BY name`).all();
  const secondary = db.prepare(`SELECT type, name, sql FROM sqlite_master
    WHERE type IN ('index','view','trigger') AND name NOT LIKE 'sqlite_%'
      AND sql IS NOT NULL
    ORDER BY CASE type WHEN 'view' THEN 1 WHEN 'index' THEN 2 ELSE 3 END, name`).all();
  const lines = [
    '-- JavaTerrain complete SQLite backup',
    `-- Source: ${source}`,
    `-- Created UTC: ${new Date().toISOString()}`,
    'PRAGMA foreign_keys=OFF;',
    'BEGIN IMMEDIATE;'
  ];
  for (const table of tables) {
    lines.push('', `${table.sql};`);
  }
  for (const table of tables) {
    const columns = db.prepare(`PRAGMA table_info(${quoteIdentifier(table.name)})`).all().map(column => column.name);
    if (!columns.length) continue;
    const rows = db.prepare(`SELECT * FROM ${quoteIdentifier(table.name)}`).all();
    if (!rows.length) continue;
    const names = columns.map(quoteIdentifier).join(',');
    for (const row of rows) {
      lines.push(`INSERT INTO ${quoteIdentifier(table.name)} (${names}) VALUES (${columns.map(column => sqlValue(row[column])).join(',')});`);
    }
  }
  for (const item of secondary) lines.push('', `${item.sql};`);
  lines.push('', 'COMMIT;', 'PRAGMA foreign_keys=ON;', '');
  return { sql: lines.join('\n'), tables };
})();

fs.writeFileSync(target, dump.sql, 'utf8');
db.close();

const verificationPath = path.join(os.tmpdir(), `javaterrain-dump-check-${process.pid}.sqlite`);
fs.rmSync(verificationPath, { force: true });
const verification = new Database(verificationPath);
try {
  verification.exec(dump.sql);
  const integrity = verification.pragma('integrity_check', { simple: true });
  const foreignKeys = verification.pragma('foreign_key_check');
  if (integrity !== 'ok') throw new Error(`Integrity check failed: ${integrity}`);
  if (foreignKeys.length) throw new Error(`Foreign-key check failed: ${JSON.stringify(foreignKeys)}`);
  const counts = {};
  for (const table of dump.tables) counts[table.name] = verification.prepare(`SELECT COUNT(*) count FROM ${quoteIdentifier(table.name)}`).get().count;
  console.log(JSON.stringify({ target, bytes: fs.statSync(target).size, integrity, foreignKeyViolations: 0, tableCounts: counts }, null, 2));
} finally {
  verification.close();
  fs.rmSync(verificationPath, { force: true });
}
