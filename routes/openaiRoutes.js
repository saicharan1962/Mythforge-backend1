// routes/openaiRoutes.js

import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,   // ← store in .env
});

router.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: "Prompt required" });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a creative Greek mythology storyteller." },
        { role: "user", content: prompt },
      ],
    });

    const story = response.choices[0].message.content;
    res.json({ story });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OpenAI error", error: err.message });
  }
});

export default router;
