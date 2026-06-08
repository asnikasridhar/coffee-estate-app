import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';

dotenv.config();

const dbFile = process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'coffee-estate.sqlite');
const absolutePath = path.resolve(dbFile);
fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
console.log('Using SQLite DB:', absolutePath);

export const db = new Database(absolutePath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

export function rows(sql, params = {}) { return db.prepare(sql).all(params); }
export function row(sql, params = {}) { return db.prepare(sql).get(params); }
export function run(sql, params = {}) { return db.prepare(sql).run(params); }

export function columns(table) {
  return db.prepare(`PRAGMA table_info(${table})`).all();
}

export function insert(table, payload) {
  const cols = columns(table).map(c => c.name).filter(c => Object.prototype.hasOwnProperty.call(payload, c));
  if (!cols.length) throw new Error(`No valid columns supplied for ${table}`);
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(c => '@' + c).join(', ')})`;
  return run(sql, payload);
}

export function update(table, idColumn, id, payload) {
  const cols = columns(table).map(c => c.name).filter(c => c !== idColumn && Object.prototype.hasOwnProperty.call(payload, c));
  if (!cols.length) throw new Error(`No valid columns supplied for ${table}`);
  const sql = `UPDATE ${table} SET ${cols.map(c => `${c} = @${c}`).join(', ')} WHERE ${idColumn} = @id`;
  return run(sql, { ...payload, id });
}
