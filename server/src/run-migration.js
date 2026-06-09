
import fs from 'node:fs';
import path from 'node:path';
import { db } from './db.js';

const file = process.argv[2];

if (!file) {
  console.error('Usage: node src/run-migration.js ../../migrations/0010_plant_inventory.sql');
  process.exit(1);
}

const fullPath = path.resolve(process.cwd(), file);
const sql = fs.readFileSync(fullPath, 'utf8');

db.exec(sql);

console.log('Migration applied:', fullPath);