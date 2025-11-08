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

    if (!header) {
      console.log("❌ Không có Authorization header");
      return res.status(401).json({ error: "No token provided" });
    }

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) {
      console.log("⚠️ Header format không hợp lệ:", header);
      return res.status(401).json({ error: "Invalid token format" });
    }

    // ✅ Verify token (user dùng JWT_SECRET)
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    if (!req.user.id && !req.user.userId) {
      console.log("⚠️ Token decode được nhưng thiếu userId:", decoded);
      return res.status(401).json({ error: "Token missing userId" });
    }

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.log("⚠️ Token hết hạn");
      return res.status(401).json({ error: "Token expired" });
    }

    if (err.name === "JsonWebTokenError") {
      console.log("❌ Token sai định dạng hoặc signature:", err.message);
      return res.status(401).json({ error: "Invalid token" });
    }

    console.log("❌ Lỗi xác thực token khác:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
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

    // ✅ Verify token (admin dùng ADMIN_JWT_SECRET)
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    req.user = decoded;

    if (!req.user.userId)
      return res.status(401).json({ error: "Token missing userId" });

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ error: "Token expired" });
    if (err.name === "JsonWebTokenError")
      return res.status(401).json({ error: "Invalid admin token" });

    console.log("❌ Lỗi xác thực admin token khác:", err.message);
    return res.status(401).json({ error: "Unauthorized admin" });
  }
}

// =============================================================
// 🧱 Middleware kiểm tra quyền admin/master (authorizeAdmin)
// -------------------------------------------------------------
function authorizeAdmin(req, res, next) {
  if (!req.user) {
    console.log("⚠️ Chưa đăng nhập, từ chối truy cập admin");
    return res.status(401).json({ error: "Not authenticated" });
  }

  const role = req.user.role?.toLowerCase();
  if (role !== "admin" && role !== "master") {
    console.log("🚫 Người dùng không có quyền admin/master:", role);
    return res.status(403).json({ error: "Require admin or master role" });
  }

  console.log("✅ Admin/Master access granted cho:", req.user.email);
  next();
}

module.exports = { authenticateJWT, authenticateAdminJWT, authorizeAdmin };
