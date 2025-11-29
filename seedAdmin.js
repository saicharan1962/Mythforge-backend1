/* seedAdmin.js */

import { pool } from './db.js';
import bcrypt from 'bcrypt';

async function seed() {
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (username) DO UPDATE SET password_hash = $3, role = $4`,
    ['admin', 'admin@mythforge.com', hash, 'admin']
  );
  console.log("✅ Admin created: admin@mythforge.com / admin123");
  await pool.end();
}

seed();
