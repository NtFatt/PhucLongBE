// =============================================================
// 🧩 Middleware: JWT Authentication & Authorization
// -------------------------------------------------------------
// ✅ Load secret từ .env
// ✅ Ghi log rõ ràng (debug header, token, decoded user)
// ✅ Phân biệt lỗi format / thiếu token / verify sai / hết hạn
// ✅ Gán req.user = { userId, email, role } cho controller
// =============================================================

require("dotenv").config();
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
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

    
    // ✅ Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ Gán thông tin user vào request để controller dùng
    req.user = decoded;

    // ✅ Kiểm tra payload hợp lệ
    if (!req.user.userId) {
      console.log("⚠️ Token decode được nhưng thiếu userId:", decoded);
      return res.status(401).json({ error: "Token missing userId" });
    }

    next();
  } catch (err) {
    // ⚠️ Phân loại lỗi JWT rõ ràng
    if (err.name === "TokenExpiredError") {
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
// 🧱 Middleware kiểm tra quyền admin (authorizeAdmin)
// -------------------------------------------------------------
function authorizeAdmin(req, res, next) {
  if (!req.user) {
    console.log("⚠️ Chưa đăng nhập, từ chối truy cập admin");
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.user.role !== "admin") {
    console.log("🚫 Người dùng không có quyền admin:", req.user.role);
    return res.status(403).json({ error: "Require admin role" });
  }

  console.log("✅ Admin access granted cho:", req.user.email);
  next();
}

module.exports = { authenticateJWT, authorizeAdmin };
