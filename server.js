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
import lifeEventRoutes from "./routes/lifeEventRoutes.js";

const app = express();
const PORT = process.env.PORT || 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------
// ✅ CORS FIX FOR AZURE
// ----------------------------
app.use(
  cors({
    origin: [
      "https://kind-cliff-0fa061e0f.4.azurestaticapps.net", // Azure frontend
      "http://localhost:3000", // Local dev
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "public/images")));

// ----------------------------
// API Routes
// ----------------------------
app.use("/api/auth", authRoutes);
app.use("/api/myths", mythRoutes);
app.use("/api/openai", openaiRoutes);
app.use("/api/life-events", lifeEventRoutes);

// ----------------------------
// Test Route
// ----------------------------
app.get("/api/ping", (req, res) => {
  res.status(200).send("pong");
});

// ----------------------------
// Root (Azure test)
// ----------------------------
app.get("/", (req, res) => {
  res.send("MythForge Backend Running Successfully");
});

// ----------------------------
// Start Server
// ----------------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
