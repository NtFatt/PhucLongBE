// ============================================================
// 🧩 ADMIN AUTH ROUTE - STABLE VERSION (LOGIN + REFRESH TOKEN)
// ============================================================
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getPool } = require("../../config/db");
const logger = require("../../utils/logger");

const router = express.Router();

// ============================================================
// 🔐 POST /api/admin/auth/login
// ============================================================
router.post("/login", async (req, res) => {
    const { email, password } = req.body || {};
    logger.info("📩 Admin login request received", { email });

    try {
        if (!email || !password)
            return res.status(400).json({ ok: false, error: "Thiếu email hoặc mật khẩu" });

        // ✅ Kết nối SQL
        const pool = await getPool();
        const query = `
      SELECT TOP 1 * 
      FROM Admin 
      WHERE Email = @email AND IsActive = 1
    `;
        const result = await pool.request().input("email", email).query(query);

        if (result.recordset.length === 0)
            return res.status(404).json({ ok: false, error: "Tài khoản không tồn tại hoặc bị khóa" });

        const admin = result.recordset[0];
        logger.info(`👤 Found admin record ID=${admin.Id}, Name=${admin.Name}`);

        // ✅ Kiểm tra mật khẩu
        const valid = await bcrypt.compare(password, admin.PasswordHash);
        if (!valid) {
            logger.warn(`🚫 Sai mật khẩu cho admin ${email}`);
            return res.status(401).json({ ok: false, error: "Sai mật khẩu" });
        }

        // ✅ Tạo Access Token & Refresh Token
        const token = jwt.sign(
            { id: admin.Id, email: admin.Email, role: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
        );

        const refreshToken = jwt.sign(
            { id: admin.Id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: `${process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7}d` }
        );

        logger.info(`🎫 JWT generated for admin ${email}`);

        // ✅ Trả về dữ liệu
        return res.status(200).json({
            ok: true,
            message: "Đăng nhập thành công",
            token,
            refreshToken,
            admin: {
                id: admin.Id,
                name: admin.Name,
                email: admin.Email,
                role: admin.Role,
                phone: admin.Phone,
            },
        });
    } catch (err) {
        logger.error("💥 Lỗi đăng nhập admin:", err);
        return res.status(500).json({
            ok: false,
            error: "Lỗi máy chủ, vui lòng thử lại sau.",
            details: process.env.NODE_ENV === "development" ? err.message : undefined,
        });
    }
});

// ============================================================
// ♻️ POST /api/admin/auth/refresh
// ------------------------------------------------------------
// Nhận refreshToken từ FE và phát hành access token mới
// ============================================================
router.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body || {};
    if (!refreshToken)
        return res.status(400).json({ ok: false, error: "Thiếu refreshToken" });

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const newToken = jwt.sign(
            { id: decoded.id, role: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
        );

        return res.json({ ok: true, token: newToken });
    } catch (err) {
        logger.warn("⚠️ Refresh token không hợp lệ:", err.message);
        return res.status(401).json({ ok: false, error: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }
});

// ============================================================
// 🔍 TEST ROUTE
// ============================================================
router.get("/test", (req, res) => {
    res.json({ ok: true, message: "✅ Admin Auth API đang hoạt động" });
});

module.exports = router;
