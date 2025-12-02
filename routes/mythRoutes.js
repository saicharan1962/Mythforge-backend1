// routes/mythRoutes.js
import express from "express";
import { verifyToken, requireRole, authenticate } from "../middleware/authMiddleware.js";
import { createMyth, getMyths, getMythById } from "../controllers/mythController.js";


const router = express.Router();

// ==============================================
// USER ROUTES
// ==============================================

// POST /api/myths → Create myth (user or admin only)
router.post("/", verifyToken, requireRole("user"), createMyth);

// GET /api/myths → Get all myths (any authenticated user)
router.get("/", authenticate, getMyths);

// ==============================================
// ADMIN TEST ROUTE
// ==============================================

// GET /api/myths/admin-only → Only admins can access
router.get("/admin-only", verifyToken, requireRole("admin"), (req, res) => {
  res.json({
    message: "Welcome Admin! You have full access.",
    user: req.user
  });
});

// ==============================================

router.get("/:id", authenticate, getMythById);
export default router;
