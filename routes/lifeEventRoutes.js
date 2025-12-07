// routes/lifeEventRoutes.js
import express from "express";
import { createLifeEvent, getLifeEventsByUser } from "../controllers/lifeEventController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Save a new life event
router.post("/", verifyToken, createLifeEvent);

// Get all life events of logged-in user
router.get("/", verifyToken, getLifeEventsByUser);

export default router;
