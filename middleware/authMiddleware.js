// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

// --------------------------------------
// Verify JWT Token
// --------------------------------------
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mythforge_secret_123");
    req.user = decoded; // Decoded token contains { user_id, role }
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// --------------------------------------
// Role-Based Authorization
// --------------------------------------
export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ message: `Forbidden: Requires ${requiredRole} role` });
    }

    next();
  };
};

// Alias for compatibility (optional)
export const authenticate = verifyToken;
