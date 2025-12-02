// ---- routes/openaiRoutes.js ----
import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generic test endpoint
router.get("/test", async (req, res) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Reply only: Hello MythForge!" },
        { role: "user", content: "Hello?" }
      ]
    });

    res.json({ reply: response.choices[0].message.content });

  } catch (err) {
    console.error("❌ OpenAI test error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
