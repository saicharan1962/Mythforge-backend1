// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

/* ---------------- Verify Token Middleware ---------------- */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // ✅ Use secret from .env only (no fallback for production safety)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      user_id: decoded.user_id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

/* ---------------- Role-based Authorization ---------------- */
export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ Allow super-admins or matching role
    if (req.user.role !== requiredRole && req.user.role !== "superadmin") {
      return res.status(403).json({
        message: `Forbidden: Requires ${requiredRole} role`,
      });
    }

    next();
  };
};

/* ---------------- General Authentication Alias ---------------- */
export const authenticate = verifyToken;
