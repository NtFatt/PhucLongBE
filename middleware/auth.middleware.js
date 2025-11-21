// =============================================================
// 🧩 Middleware: JWT Authentication & Authorization
// -------------------------------------------------------------
// ✅ Xác thực người dùng qua JWT
// ✅ Hỗ trợ nhiều role: admin, Master
// ✅ Ghi log chi tiết để debug
// =============================================================

require("dotenv").config();
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || JWT_SECRET;

// =============================================================
// 🧱 Middleware xác thực người dùng (authenticateJWT)
// -------------------------------------------------------------
function authenticateJWT(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "No token provided" });

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token)
      return res.status(401).json({ error: "Invalid token format" });

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.role)
      return res.status(401).json({ error: "Invalid token payload" });

    req.user = decoded; // { id, email, role }

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ error: "Token expired" });

    return res.status(401).json({ error: "Unauthorized token" });
  }
}


// =============================================================
// 🧱 Middleware xác thực token dành riêng cho admin
// -------------------------------------------------------------
function authenticateAdminJWT(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "No token provided" });

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token)
      return res.status(401).json({ error: "Invalid token format" });

    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);

    if (!decoded?.role) return res.status(401).json({ error: "Invalid admin token" });

    req.user = decoded;

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ error: "Admin token expired" });

    return res.status(401).json({ error: "Unauthorized admin" });
  }
}

// =============================================================
// 🧱 Middleware kiểm tra quyền admin/master (authorizeAdmin)
// -------------------------------------------------------------
function authorizeAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  const role = req.user.role?.toLowerCase();

  if (role !== "admin" && role !== "master") {
    return res.status(403).json({ error: "Require admin or master role" });
  }

  next();
}


module.exports = { authenticateJWT, authenticateAdminJWT, authorizeAdmin };
