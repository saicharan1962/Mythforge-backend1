// ---- routes/mythRoutes.js ----
import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { createMyth, getMyths, getMythById } from "../controllers/mythController.js";

const router = express.Router();

/* ---------------------- CREATE MYTH ---------------------- */
router.post("/", verifyToken, createMyth);

/* ---------------------- GET ALL MYTHS FOR LOGGED-IN USER ---------------------- */
router.get("/", verifyToken, getMyths);

/* ---------------------- GET SINGLE MYTH BY ID ---------------------- */
router.get("/:id", verifyToken, getMythById);

export default router;
