// db.js
import { Pool } from 'pg';

export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'MythForge',  // ← EXACT SAME AS IN PGADMIN
  password: 'Sunil@1996',
  port: 5432,
});