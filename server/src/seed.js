import fs from 'node:fs';
import path from 'node:path';
import { db } from './db.js';

const migration = path.resolve(process.cwd(), '../migrations/001_schema_seed.sql');
const sql = fs.readFileSync(migration, 'utf8');
db.exec(sql);
console.log('SQLite database seeded at', process.env.DATABASE_FILE || './data/coffee-estate.sqlite');
