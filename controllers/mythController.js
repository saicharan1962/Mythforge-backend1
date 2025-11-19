// controllers/mythController.js
import { pool } from '../db.js';  // ← Real DB
import dotenv from "dotenv";
dotenv.config();

// Optional: Keep god list for future AI prompts
const gods = [
 "Zeus",
  "Hera",
  "Athena",
  "Apollo",
  "Artemis",
  "Ares",
  "Aphrodite",
  "Hermes",
  "Demeter",
  "Hephaestus",
  "Hades",
  "Persephone",
  "Hercules (Heracles)",
  "Odysseus",
  "Atalanta",
  "Orpheus",
  "Psyche",
  "Hades",
  "Persephone",
  "The Fates"
];

export const createMyth = async (req, res) => {
  const { title, narrative, lifeEvents = [] } = req.body;
  const userId = req.user.user_id;

  // Validate
  if (!title && !narrative) {
    return res.status(400).json({ message: "Title or narrative is required" });
  }

  try {
    // Start transaction
    await pool.query('BEGIN');

    // Default title/narrative with random god
    const selectedGod = gods[Math.floor(Math.random() * gods.length)];
    const finalTitle = title || `The Tale of ${selectedGod}`;
    const finalNarrative = narrative || `A legend unfolds as ${selectedGod} guides our hero through their journey of transformation.`;

    // Insert myth
    const mythResult = await pool.query(
      `INSERT INTO Myths (user_id, title, narrative, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING myth_id, title, narrative, created_at`,
      [userId, finalTitle, finalNarrative]
    );
    const myth = mythResult.rows[0];
    const mythId = myth.myth_id;

    // Insert life events (if any)
    for (const event of lifeEvents) {
      await pool.query(
        `INSERT INTO LifeEvents (myth_id, description, event_type, event_date, mythical_mapping)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          mythId,
          event.description || '',
          event.event_type || 'unknown',
          event.event_date || null,
          event.mythical_mapping || null
        ]
      );
    }

    await pool.query('COMMIT');

    res.status(201).json({
      message: "Myth created successfully",
      myth
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error("Create myth error:", err);
    res.status(500).json({ message: "Failed to create myth" });
  }
};

export const getMyths = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      `SELECT myth_id, title, narrative, created_at
       FROM Myths
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      message: "Myths retrieved",
      myths: result.rows
    });
  } catch (err) {
    console.error("Get myths error:", err);
    res.status(500).json({ message: "Server error" });
  }
};