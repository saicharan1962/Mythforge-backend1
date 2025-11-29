// db.js
import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mythforge",
  password: "Sunil@1996",
  port: 5432,
});

(async () => {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()");
    console.log("✅ Connected to PostgreSQL database successfully:", res.rows[0].now);
    client.release();
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
  }
})();
