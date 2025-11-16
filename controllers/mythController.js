// controllers/mythController.js
import { pool, sequelize } from "../db.js";
import dotenv from "dotenv";
dotenv.config();

const gods = [
  "Zeus", "Hera", "Athena", "Apollo", "Artemis", "Ares",
  "Aphrodite", "Hermes", "Demeter", "Hephaestus",
  "Hades", "Persephone", "Hercules (Heracles)", "Odysseus",
  "Atalanta", "Orpheus", "Psyche", "The Fates"
];

// 🏛️ Create a new myth
export const createMyth = async (req, res) => {
  const { title, narrative, lifeEvents = [] } = req.body;
  const userId = req.user.user_id;

  if (!title && !narrative) {
    return res.status(400).json({ message: "Title or narrative is required" });
  }

  try {
    await pool.query("BEGIN");

    const selectedGod = gods[Math.floor(Math.random() * gods.length)];
    const finalTitle = title || `The Tale of ${selectedGod}`;
    const finalNarrative =
      narrative ||
      `A legend unfolds as ${selectedGod} guides our hero through their journey of transformation.`;

    const mythResult = await pool.query(
      `INSERT INTO myths (user_id, title, narrative, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING myth_id, title, narrative, created_at`,
      [userId, finalTitle, finalNarrative]
    );

    const myth = mythResult.rows[0];
    const mythId = myth.myth_id;

    for (const event of lifeEvents) {
      await pool.query(
        `INSERT INTO lifeevents (myth_id, description, event_type, event_date, mythical_mapping)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          mythId,
          event.description || "",
          event.event_type || "unknown",
          event.event_date || null,
          event.mythical_mapping || null,
        ]
      );
    }

    await pool.query("COMMIT");
    res.status(201).json({ message: "Myth created successfully", myth });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ Create myth error:", err.message);
    res.status(500).json({ message: "Failed to create myth", error: err.message });
  }
};

// 📜 Get all myths
export const getMyths = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      `SELECT myth_id, title, narrative, created_at
       FROM myths
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      message: "Myths retrieved successfully",
      myths: result.rows,
    });
  } catch (err) {
    console.error("❌ Get myths error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🔍 Get a single myth by ID (with life events)
export const getMythById = async (req, res) => {
  const userId = req.user.user_id;
  const mythId = req.params.id;

  try {
    const mythResult = await pool.query(
      `SELECT myth_id, title, narrative, created_at
       FROM myths
       WHERE myth_id = $1 AND user_id = $2`,
      [mythId, userId]
    );

    if (mythResult.rows.length === 0) {
      return res.status(404).json({ message: "Myth not found or unauthorized" });
    }

    const lifeEventsResult = await pool.query(
      `SELECT event_id, description, event_type, event_date, mythical_mapping
       FROM lifeevents
       WHERE myth_id = $1`,
      [mythId]
    );

    res.status(200).json({
      message: "Myth retrieved successfully",
      myth: mythResult.rows[0],
      lifeEvents: lifeEventsResult.rows,
    });
  } catch (err) {
    console.error("❌ Get myth by ID error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✏️ Update an existing myth
export const updateMyth = async (req, res) => {
  const userId = req.user.user_id;
  const mythId = req.params.id;
  const { title, narrative } = req.body;

  try {
    const result = await pool.query(
      `UPDATE myths
       SET title = COALESCE($1, title),
           narrative = COALESCE($2, narrative),
           updated_at = NOW()
       WHERE myth_id = $3 AND user_id = $4
       RETURNING myth_id, title, narrative, updated_at`,
      [title, narrative, mythId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Myth not found or unauthorized" });
    }

    res.status(200).json({
      message: "Myth updated successfully",
      myth: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Update myth error:", err.message);
    res.status(500).json({ message: "Failed to update myth", error: err.message });
  }
};

// 🗑️ Delete a myth and its life events
export const deleteMyth = async (req, res) => {
  const userId = req.user.user_id;
  const mythId = req.params.id;

  try {
    await pool.query("BEGIN");

    const mythCheck = await pool.query(
      `SELECT myth_id FROM myths WHERE myth_id = $1 AND user_id = $2`,
      [mythId, userId]
    );

    if (mythCheck.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "Myth not found or unauthorized" });
    }

    await pool.query(`DELETE FROM lifeevents WHERE myth_id = $1`, [mythId]);
    await pool.query(`DELETE FROM myths WHERE myth_id = $1 AND user_id = $2`, [mythId, userId]);

    await pool.query("COMMIT");

    res.status(200).json({ message: "Myth deleted successfully" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ Delete myth error:", err.message);
    res.status(500).json({ message: "Failed to delete myth", error: err.message });
  }
};
