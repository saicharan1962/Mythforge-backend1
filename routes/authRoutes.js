// routes/authRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail
} from "../controllers/authController.js";

import {
  verifyToken,
  requireRole
} from "../middleware/authMiddleware.js";

import { pool } from "../db.js";

const router = express.Router();

/* ======================================================
   REGISTER & LOGIN
   ====================================================== */
router.post("/register", registerUser);
router.post("/login", loginUser);

/* ======================================================
   EMAIL VERIFICATION
   ====================================================== */
router.get("/verify/:token", verifyEmail);

/* ======================================================
   GET CURRENT LOGGED-IN USER (PROTECTED)
   ====================================================== */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT user_id, username, email, role, is_verified FROM users WHERE user_id = $1",
      [req.user.user_id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ======================================================
   ADMIN: GET ALL USERS
   Protected: Only admin or superadmin can access
   ====================================================== */
router.get(
  "/all-users",
  verifyToken,
  requireRole("admin"), // admin OR superadmin
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT user_id, username, email, role, is_verified FROM users ORDER BY user_id ASC"
      );

      res.json({ users: result.rows });
    } catch (err) {
      console.error("❌ Admin fetch users error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);
// ADMIN: Toggle a user's active status
router.patch(
  "/toggle-active/:id",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const userId = req.params.id;

      const result = await pool.query(
        `UPDATE users 
         SET is_active = NOT is_active 
         WHERE user_id = $1 
         RETURNING user_id, username, email, role, is_active`,
        [userId]
      );

      res.json({
        message: "User status updated",
        user: result.rows[0],
      });

    } catch (err) {
      console.error("❌ Toggle active error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
