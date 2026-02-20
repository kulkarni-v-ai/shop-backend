import jwt from "jsonwebtoken";

/**
 * JWT Authentication Middleware
 * Verifies the Bearer token from the Authorization header.
 * Attaches decoded payload to req.admin on success.
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please login again." });
    }
    return res.status(401).json({ message: "Invalid token." });
  }
};

/**
 * RBAC Authorization Middleware
 * Must be used AFTER verifyToken.
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin || !req.admin.role) {
      return res.status(403).json({ message: "Forbidden: No role assigned." });
    }
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions." });
    }
    next();
  };
};

export default verifyToken;
