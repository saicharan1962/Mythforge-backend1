import jwt from "jsonwebtoken";

// ✅ Verify token middleware
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    req.user = decoded; // { user_id, role }
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ✅ Role-based authorization
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

// ✅ General authentication check (alias)
export const authenticate = verifyToken;
