// server.js
import dotenv from "dotenv";
dotenv.config();   // ✅ Load env FIRST

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "public/images")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/myths", mythRoutes);
app.use("/api/openai", openaiRoutes);

// Home route
app.get("/", (req, res) => {
  res.send("✅ MythForge Backend Running Successfully");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MythForge backend running on http://localhost:${PORT}`);
});
