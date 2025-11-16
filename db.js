// db.js
import pkg from "pg";
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

// 🧩 PostgreSQL Pool (for raw SQL queries in controllers)
export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: false, // set to true if deploying to AWS/Railway/etc
});

// 🧩 Sequelize ORM (for models & migrations)
export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "postgres",
    port: process.env.DB_PORT || 5432,
    logging: false, // disable SQL logs in console
  }
);

// 🔍 Verify both connections
(async () => {
  try {
    const now = await pool.query("SELECT NOW()");
    console.log("✅ Connected to PostgreSQL via pool (legacy mode):", now.rows[0].now);

    await sequelize.authenticate();
    console.log("✅ Connected to PostgreSQL via Sequelize (ORM mode).");
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
  }
})();

// ✅ Export default (for convenience imports)
export default sequelize;
