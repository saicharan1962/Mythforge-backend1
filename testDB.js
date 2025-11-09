// testDB.js
import { pool } from './db.js';

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL CONNECTED SUCCESSFULLY!');
    const res = await client.query('SELECT NOW()');
    console.log('Time from DB:', res.rows[0].now);
    client.release();
  } catch (err) {
    console.error('DB CONNECTION FAILED:');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    console.error('Hint:', err.hint || 'No hint');
  } finally {
    await pool.end();
  }
}

testConnection();