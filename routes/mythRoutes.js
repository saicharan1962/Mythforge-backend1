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

// Retrieve all myths for a specific user (history page)
router.get("/user/:userId", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { Myth } = require("../models/Myth"); // adjust path if needed
    const myths = await Myth.find({ user: userId }).sort({ created_at: -1 });
    res.json({ myths });
  } catch (err) {
    console.error("Error retrieving user's myths:", err);
    res.status(500).json({ error: "Failed to fetch user's myths" });
  }
});
router.get("/", authenticate, (req,res,next)=>{
  console.log("✅ /api/myths hit, user:", req.user);
  next();
}, getMyths);
export default router;
