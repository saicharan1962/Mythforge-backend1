// ---- routes/mythRoutes.js ----
import express from "express";
import { verifyToken, requireRole, authenticate } from "../middleware/authMiddleware.js";
import { createMyth, getMyths, getMythById } from "../controllers/mythController.js";

const router = express.Router();

// Create a myth
router.post("/", verifyToken, requireRole("user"), createMyth);

// Retrieve all myths for logged-in user
router.get("/", authenticate, getMyths);

// Retrieve single myth
router.get("/:id", authenticate, getMythById);

export default router;
