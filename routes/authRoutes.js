import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { pool } from "../db.js";

const router = express.Router();

// Register and login routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// ✅ Authenticated route: Get current user info
router.get("/me", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT user_id, username, email, role FROM users WHERE user_id = $1",
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
