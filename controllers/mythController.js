/* ---- controllers/mythController.js ---- */

import { pool } from "../db.js";
import dotenv from "dotenv";
dotenv.config();

/* ---------------------- FIXED GREEK GOD LIST ---------------------- */
const ALLOWED_GODS = [
  "Aphrodite", "Apollo", "Ares", "Artemis", "Atalanta", "Athena", "Demeter",
  "Hades", "Hecate", "Hephaestus", "Hera", "Hercules", "Hermes", "Odysseus",
  "Orpheus", "Persephone", "Perseus", "Psyche", "The Fates", "Zeus"
];

/* ---------------------- MYTHFORGE ORACLE PROMPT ---------------------- */
const SYSTEM_PROMPT = `
You are the MythForge Oracle.

When the user provides a life event, your tasks are:

1. Choose one Greek god/goddess from this EXACT list:
Aphrodite, Apollo, Ares, Artemis, Atalanta, Athena, Demeter, Hades, Hecate,
Hephaestus, Hera, Hercules, Hermes, Odysseus, Orpheus, Persephone, Perseus,
Psyche, The Fates, Zeus.

2. Retell the user’s life event as a Greek-myth-inspired short story written
in poetic English — NOT as a poem.

Style rules:
- Write in flowing, lyrical prose using paragraphs.
- Do NOT rhyme.
- Do NOT write stanzas or line-by-line poetry.
- Maintain a mythic, elevated tone, like an ancient storyteller.
- The narrative should feel like a mythic tale, not a poem.

3. Output EXACTLY in this format:

Name of Greek/Goddess: <deity>

Narrative:
"<mythic story in poetic prose>"

No explanations. No meta text. No links. No notes.
Only clean output in the exact above format.
`;

export const createMyth = async (req, res) => {
  const { event, title } = req.body;
  const userId = req.user.user_id;

  if (!event || event.trim().length === 0) {
    return res.status(400).json({ message: "Life event description is required" });
  }

  try {
    await pool.query("BEGIN");

    const defaultTitle = title || "A Mythic Tale";
    let finalTitle = defaultTitle;
    let finalNarrative = "";

    /* -------------------- OPENAI CALL -------------------- */
    try {
      const { OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const userPrompt = `Life Event: "${event}"`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.95,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ]
      });

      const aiOutput = response.choices[0].message.content.trim();

      /* -------------------- EXTRACT RESULTS -------------------- */
      const nameMatch = aiOutput.match(/Name of Greek\/Goddess:\s*([^"\n]+)/i);
      const narrativeMatch = aiOutput.match(/Narrative:\s*([\s\S]+)/i);

      let deity = nameMatch ? nameMatch[1].trim() : defaultTitle;
      let narrative = narrativeMatch ? narrativeMatch[1].trim() : aiOutput;

      // Validate deity
      if (!ALLOWED_GODS.includes(deity)) {
        console.warn("⚠️ Invalid deity returned. Applying fallback: Zeus");
        deity = "Zeus";
      }

      finalTitle = deity;
      finalNarrative = narrative;

    } catch (err) {
      console.error("⚠️ OpenAI error:", err.message);
      finalNarrative =
        "The Oracle fell silent for a moment, yet the mortal’s tale still echoed with mythic promise.";
    }

    /* -------------------- SAVE TO DATABASE -------------------- */
    const mythResult = await pool.query(
      `INSERT INTO Myths (user_id, title, narrative, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING myth_id, title, narrative, created_at`,
      [userId, finalTitle, finalNarrative]
    );

    await pool.query("COMMIT");

    return res.status(201).json({
      message: "Myth created successfully",
      myth: mythResult.rows[0],
    });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ Create myth error:", err);
    return res.status(500).json({ message: "Failed to create myth" });
  }
};

/* ---------------------- GET ALL MYTHS ---------------------- */
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

    return res.json({
      message: "Myths retrieved successfully",
      myths: result.rows,
    });

  } catch (err) {
    console.error("❌ Get myths error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ---------------------- GET MYTH BY ID ---------------------- */
export const getMythById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      `SELECT myth_id, title, narrative, created_at
       FROM Myths
       WHERE myth_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Myth not found" });
    }

    return res.json({
      message: "Myth retrieved successfully",
      myth: result.rows[0],
    });

  } catch (err) {
    console.error("❌ Get myth by ID error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
