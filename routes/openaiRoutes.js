// routes/openaiRoutes.js
import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ✅ Loaded from .env
});

/* -------------------------------------------------------------------------- */
/* MAIN GENERATION ENDPOINT                                                   */
/* -------------------------------------------------------------------------- */
router.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: "Prompt required" });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "what is the color of" },
        { role: "user", content: prompt },
      ],
    });

    const story = response.choices[0].message.content;
    res.json({ story });
  } catch (err) {
    console.error("❌ OpenAI error:", err);
    res.status(500).json({ message: "OpenAI error", error: err.message });
  }
});

/* -------------------------------------------------------------------------- */
/* DIAGNOSTIC TEST ENDPOINT                                                   */
/* -------------------------------------------------------------------------- */
router.get("/test", async (req, res) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a friendly bot that only replies 'Hello MythForge!'" },
        { role: "user", content: "Say hello" },
      ],
    });

    res.json({ success: true, reply: response.choices[0].message.content });
  } catch (err) {
    console.error("❌ OpenAI test error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
