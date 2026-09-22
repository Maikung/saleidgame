const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Authentication token is required" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "development-only-secret");
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired authentication token" });
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: "You do not have permission for this action" });
  next();
};

module.exports = { protect, allowRoles };
