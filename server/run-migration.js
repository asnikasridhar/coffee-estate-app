import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const dbFile = process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'coffee-estate.sqlite');
const dbPath = path.resolve(dbFile);
const migrationsDir = path.resolve(process.cwd(), '..', 'migrations');

if (!fs.existsSync(dbPath)) {
  console.error('Database not found:', dbPath);
  process.exit(1);
}
if (!fs.existsSync(migrationsDir)) {
  console.error('Migrations folder not found:', migrationsDir);
  process.exit(1);
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_on TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

const applied = new Set(db.prepare('SELECT filename FROM schema_migrations').all().map(r => r.filename));
const files = fs.readdirSync(migrationsDir)
  .filter(f => /^\d+.*\.sql$/.test(f))
  .sort();

function runSqlTolerant(sql) {
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map(s => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    try {
      db.exec(stmt + ';');
    } catch (err) {
      const msg = String(err.message || '');
      if (msg.includes('duplicate column name')) {
        console.log('  skipped:', msg);
        continue;
      }
      throw err;
    }
  }
}

for (const file of files) {
  if (applied.has(file)) {
    console.log('Skipping already applied', file);
    continue;
  }
  const fullPath = path.join(migrationsDir, file);
  console.log('Applying', file);
  runSqlTolerant(fs.readFileSync(fullPath, 'utf8'));
  db.prepare('INSERT OR IGNORE INTO schema_migrations(filename) VALUES (?)').run(file);
}

console.log('Migrations complete.');
console.log('Tables:', db.prepare("SELECT COUNT(*) AS total FROM sqlite_master WHERE type='table'").get().total);
db.close();
