// db.js
import pkg from "pg";
const { Pool } = pkg;

// Create PostgreSQL pool (shared across controllers)
export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mythforge",
  password: "Sunil@1996",
  port: 5432,
});

// Optional: Test DB connection once when server starts
(async () => {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()");
    console.log("✅ Connected to PostgreSQL successfully:", res.rows[0].now);
    client.release();
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
  }
})();
