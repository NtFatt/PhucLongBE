// =============================================================
// 🧩 Token Service (Access & Refresh Tokens)
// -------------------------------------------------------------
// ✅ Dùng chung JWT_SECRET với middleware & AuthService
// ✅ Bảo đảm payload chứa userId, email, role
// ✅ Lưu refresh token vào DB (7 ngày)
// =============================================================

require("dotenv").config();
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { sql, getPool } = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

class TokenService {
  // =====================================================
  // 1️⃣ TẠO ACCESS TOKEN (JWT)
  // -----------------------------------------------------
  // 🧠 Payload phải chứa userId để middleware nhận dạng
  // =====================================================
  static async signAccessToken({ userId, email, role }) {
    if (!userId) throw new Error("Missing userId in payload");
    const payload = { userId, email, role };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
    return token;
  }

  // =====================================================
  // 2️⃣ TẠO REFRESH TOKEN & LƯU VÀO DB
  // =====================================================
  static async generateRefreshToken(userId) {
    const token = `${uuidv4()}.${uuidv4()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày

    const pool = await getPool();
    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("Token", sql.NVarChar, token)
      .input("ExpiresAt", sql.DateTime2, expiresAt)
      .query(`
        INSERT INTO RefreshTokens (UserId, Token, ExpiresAt)
        VALUES (@UserId, @Token, @ExpiresAt)
      `);

    return token;
  }

  // =====================================================
  // 3️⃣ KIỂM TRA REFRESH TOKEN CÒN HẠN KHÔNG
  // =====================================================
  static async verifyRefreshToken(token) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("Token", sql.NVarChar, token)
      .query("SELECT UserId, ExpiresAt FROM RefreshTokens WHERE Token=@Token");

    const record = result.recordset[0];
    if (!record) throw new Error("Refresh token không hợp lệ");
    if (new Date(record.ExpiresAt) < new Date())
      throw new Error("Refresh token đã hết hạn");

    return record.UserId;
  }

  // =====================================================
  // 4️⃣ HUỶ REFRESH TOKEN (ĐĂNG XUẤT)
  // =====================================================
  // ======================
  // 6️⃣ LÀM MỚI TOKEN (chuẩn)
  // ======================
  static async refreshToken(refreshToken) {
    const pool = await getPool();
    const userId = await TokenService.verifyRefreshToken(refreshToken);

    // Lấy thông tin user để tái ký JWT đầy đủ
    const result = await pool
      .request()
      .input("Id", sql.Int, userId)
      .query("SELECT Id, Email, Name, Role FROM Users WHERE Id=@Id");

    const user = result.recordset[0];
    if (!user) throw new Error("Không tìm thấy người dùng");

    const accessToken = await TokenService.signAccessToken({
      userId: user.Id,
      email: user.Email,
      role: user.Role,
    });

    return { accessToken };
  }

}

module.exports = TokenService;
