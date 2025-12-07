// controllers/lifeEventController.js
import { pool } from "../db.js";

// Helper: Format date as YYYY-MM-DD for PostgreSQL
const formatDateForPostgres = (inputDate) => {
  const date = inputDate ? new Date(inputDate) : new Date();
  if (isNaN(date.getTime())) throw new Error("Invalid date");
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD
};

// ================================
// CREATE LIFE EVENT
// ================================
export const createLifeEvent = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    let { title = "Untitled Event", description = "", event_type = "general", event_date } = req.body;

    if (!user_id) return res.status(401).json({ error: "Unauthorized: Missing user ID." });
    if (!title.trim()) return res.status(400).json({ error: "Title is required." });

    let formattedDate;
    try {
      formattedDate = formatDateForPostgres(event_date);
    } catch {
      return res.status(400).json({ error: "Invalid event_date format." });
    }

    console.log("Inserting LifeEvent:", { user_id, title, description, event_type, event_date: formattedDate });

    const result = await pool.query(
      `INSERT INTO lifeevents (user_id, title, description, event_type, event_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING event_id, user_id, title, description, event_type, event_date, created_at`,
      [user_id, title.trim(), description.trim(), event_type, formattedDate]
    );

    console.log("Life Event Inserted:", result.rows[0]);
    return res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("LifeEvent INSERT ERROR:", err);
    return res.status(500).json({ error: "Failed to save life event." });
  }
};

// ================================
// GET LIFE EVENTS FOR USER
// ================================
export const getLifeEventsByUser = async (req, res) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) return res.status(401).json({ error: "Unauthorized" });

    const result = await pool.query(
      `SELECT event_id, title, description, event_type, event_date, created_at
       FROM lifeevents
       WHERE user_id = $1
       ORDER BY event_date DESC, created_at DESC`,
      [user_id]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error("Fetch life events error:", err);
    return res.status(500).json({ error: "Failed to fetch life events." });
  }
};
