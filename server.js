// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./routes/authRoutes.js";
import mythRoutes from "./routes/mythRoutes.js";
import openaiRoutes from "./routes/openaiRoutes.js";
import lifeEventRoutes from "./routes/lifeEventRoutes.js";  // ✅ FIXED

const app = express();
const PORT = process.env.PORT || 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "public/images")));

// API Routes (must be BEFORE app.listen)
app.use("/api/auth", authRoutes);
app.use("/api/myths", mythRoutes);
app.use("/api/openai", openaiRoutes);
app.use("/api/life-events", lifeEventRoutes);  // ✅ MOVED HERE

// Simple test route
app.get("/api/ping", (req, res) => {
  res.status(200).send("pong");
});

// Root route
app.get("/", (req, res) => {
  res.send("✅ MythForge Backend Running Successfully");
});

// Start server (must be last)
app.listen(PORT, () => {
  console.log(`🚀 MythForge backend running on http://localhost:${PORT}`);
});
