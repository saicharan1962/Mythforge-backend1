// server.js
import dotenv from "dotenv";
dotenv.config(); // ✅ Load env first

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./routes/authRoutes.js";
import mythRoutes from "./routes/mythRoutes.js";
import openaiRoutes from "./routes/openaiRoutes.js";

const app = express();
const PORT = process.env.PORT || 5001;

// Path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Middleware ===
app.use(cors({ origin: "http://localhost:3000" })); // ✅ allow frontend
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "public/images")));

// === API Routes ===
app.use("/api/auth", authRoutes);
app.use("/api/myths", mythRoutes);
app.use("/api/openai", openaiRoutes);

// ✅ Quick connection test
app.get("/api/ping", (req, res) => {
  res.status(200).send("pong");
});

// === Root Route ===
app.get("/", (req, res) => {
  res.send("✅ MythForge Backend Running Successfully");
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`🚀 MythForge backend running on http://localhost:${PORT}`);
});