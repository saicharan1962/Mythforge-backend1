// db.js
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

// ✅ PostgreSQL connection via Pool
export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL successfully via pg.Pool");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected DB error:", err);
});

// ✅ Test connection immediately
(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("📅 Database connected at:", res.rows[0].now);
  } catch (err) {
    console.error("❌ Failed to connect to DB:", err.message);
  }
})();
