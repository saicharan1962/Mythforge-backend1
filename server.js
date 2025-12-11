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

// ------------------------------------
// ✅ FIXED CORS FOR DEPLOYED FRONTEND
// ------------------------------------
app.use(
  cors({
    origin: [
      "https://kind-cliff-0fa061e0f.2.azurestaticapps.net",  // correct Azure frontend
      "http://localhost:3000",                               // local dev
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "public/images")));

// ------------------------------------
// API ROUTES
// ------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/myths", mythRoutes);
app.use("/api/openai", openaiRoutes);
app.use("/api/life-events", lifeEventRoutes);

// Test route
app.get("/api/ping", (req, res) => {
  res.status(200).send("pong");
});

// Root route (confirm backend is running)
app.get("/", (req, res) => {
  res.send("MythForge Backend Running Successfully");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
