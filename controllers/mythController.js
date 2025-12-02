/* ----controllers/mythController.js------ */

import { pool } from "../db.js";
import dotenv from "dotenv";
dotenv.config();

/* --------------------------- CREATE MYTH --------------------------- */
export const createMyth = async (req, res) => {
  const { event, title, lifeEvents = [] } = req.body;
  const userId = req.user.user_id;

  // Validate input
  if (!event || event.trim().length === 0) {
    return res.status(400).json({ message: "Life event description is required" });
  }

  try {
    await pool.query("BEGIN");

    const defaultTitle = title || `The Tale of a Modern Hero`;
    let finalNarrative = "";
    let finalTitle = defaultTitle;

    /* --------------------- 🔮 Generate Myth via OpenAI --------------------- */
    try {
      const { OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const basePrompt = `
Based on the life event given by the user, identify which Greek god or goddess the user most closely matches.
Then provide a narrative of the user's input translated into a Greek-myth-style story with that god/goddess as protagonist.

Format the answer exactly as:

Name of Greek/Goddess: "<GPT content>"
Narrative: "<GPT content>"

Life event: "${event}"
`;

      // 🧠 Step 1: Initial model call
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Based on the life event given by the user, identify which Greek god or goddess the user most closely matches. Then provide a narrative of the user's input translated into a Greek-myth-style story with that god/goddess as protagonist. Format the answer exactly as Name of Greek/Goddess- GPT content next line Narrative- GPT content. You are a Greek mythology oracle who interprets human life events and writes poetic mythic retellings featuring the most fitting god or goddess from the list of Aphrodite, Apollo, Ares, Artemis, Atalanta, Athena, Demeter, Hades, Hecate, Hephaestus, Hera, Hercules, Hermes, Odysseus, Orpheus, Persephone, Perseus, Psyche, The Fates or Zeus.",
          },
          { role: "user", content: basePrompt },
        ],
      });

      let aiText = response.choices[0].message.content || "";

      // Extract the goddess/god name and the story
      let nameMatch = aiText.match(/Name of Greek\/Goddess:\s*["“]?([^"\n]+)/i);
      let narrativeMatch = aiText.match(/Narrative:\s*["“]?([\s\S]+)/i);

      finalTitle = nameMatch ? nameMatch[1].trim() : defaultTitle;
      finalNarrative = narrativeMatch ? narrativeMatch[1].trim() : aiText.trim();

      /* ----------------- 🧩 Step 2: Consistency Verification ----------------- */
      const lowerName = finalTitle.toLowerCase();
      if (!finalNarrative.toLowerCase().includes(lowerName)) {
        console.warn(`⚠️ Mismatch detected: ${finalTitle} not found in narrative`);

        const correctionPrompt = `
The previous output had a mismatch between the name and the narrative.

Here is the inconsistent version:
${aiText}

Please fix the mismatch so that the "Name of Greek/Goddess" exactly matches the protagonist of the narrative. 
Reformat your output using the same structure:
Name of Greek/Goddess: "<Corrected name>"
Narrative: "<Corrected narrative>"
`;

        const correctionResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Ensure that the god/goddess name perfectly matches the character actually featured in the narrative.",
            },
            { role: "user", content: correctionPrompt },
          ],
        });

        aiText = correctionResponse.choices[0].message.content || aiText;

        nameMatch = aiText.match(/Name of Greek\/Goddess:\s*["“]?([^"\n]+)/i);
        narrativeMatch = aiText.match(/Narrative:\s*["“]?([\s\S]+)/i);

        finalTitle = nameMatch ? nameMatch[1].trim() : finalTitle;
        finalNarrative = narrativeMatch ? narrativeMatch[1].trim() : finalNarrative;
      }

    } catch (aiErr) {
      console.error("⚠️ OpenAI error:", aiErr.message);
      finalNarrative =
        `A legend unfolds — a mortal’s journey reflects divine echoes, though the oracle was silent.`;
    }

    /* ---------------------- 💾 Save Result to Database ---------------------- */
    const mythResult = await pool.query(
      `INSERT INTO Myths (user_id, title, narrative, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING myth_id, title, narrative, created_at`,
      [userId, finalTitle, finalNarrative]
    );

    await pool.query("COMMIT");

    res.status(201).json({
      message: "Myth created successfully",
      myth: mythResult.rows[0],
    });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ Create myth error:", err);
    res.status(500).json({ message: "Failed to create myth" });
  }
};

/* ---------------------------- GET ALL MYTHS ---------------------------- */
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
      message: "Myths retrieved successfully",
      myths: result.rows,
    });
  } catch (err) {
    console.error("❌ Get myths error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------------------- GET MYTH BY ID ---------------------------- */
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

    res.json({
      message: "Myth retrieved successfully",
      myth: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Get myth by ID error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
