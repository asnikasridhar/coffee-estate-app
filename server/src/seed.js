import fs from 'node:fs';
import path from 'node:path';
import { db } from './db.js';

const migrationsDir = path.resolve(process.cwd(), '../migrations');
const schema = fs.readFileSync(path.join(migrationsDir, 'schema.sql'), 'utf8');
const seed = fs.readFileSync(path.join(migrationsDir, 'seed.sql'), 'utf8');

db.exec(schema);
db.exec(seed);

console.log('SQLite schema and seed loaded at', process.env.DATABASE_FILE || './data/coffee-estate.sqlite');
