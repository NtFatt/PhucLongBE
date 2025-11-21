const { sql, getPool } = require("../../config/db");
const bcrypt = require("bcryptjs");

class AdminCustomerService {
    // =====================
    // 1) Lấy danh sách khách hàng
    // =====================
    static async getAll() {
        const pool = await getPool();
        const rs = await pool.request().query(`
      SELECT 
        Id, Name, Email, Phone, LoyaltyPoints, 
        CreatedAt, IsVerified, GoogleLinked,
        IsActive   -- THÊM DÒNG NÀY
      FROM Users
      ORDER BY CreatedAt DESC
    `);

        return rs.recordset;
    }

    // =====================
    // 2) Lấy khách hàng theo Id
    // =====================
    static async getById(id) {
        const pool = await getPool();
        const rs = await pool.request()
            .input("Id", sql.Int, id)
            .query(`
        SELECT Id, Name, Email, Phone, LoyaltyPoints, 
               CreatedAt, IsVerified, GoogleLinked, IsActive
        FROM Users WHERE Id=@Id
      `);

        if (!rs.recordset[0]) throw new Error("Không tìm thấy khách hàng");

        return rs.recordset[0];
    }

    // =====================
    // 3) Update thông tin khách hàng
    // =====================
    static async update(id, data) {
        const { name, phone } = data;

        const pool = await getPool();
        await pool.request()
            .input("Id", sql.Int, id)
            .input("Name", sql.NVarChar, name)
            .input("Phone", sql.NVarChar, phone)
            .query(`
        UPDATE Users
        SET Name=@Name, Phone=@Phone
        WHERE Id=@Id
      `);

        return { message: "Cập nhật thông tin thành công" };
    }

    // =====================
    // 4) Đổi mật khẩu
    // =====================
    static async updatePassword(id, password) {
        const hashed = await bcrypt.hash(password, 10);

        const pool = await getPool();
        await pool.request()
            .input("Id", sql.Int, id)
            .input("PasswordHash", sql.NVarChar, hashed)
            .query(`
        UPDATE Users
        SET PasswordHash=@PasswordHash
        WHERE Id=@Id
      `);

        return { message: "Đổi mật khẩu thành công" };
    }

    // =====================
    // 5) Khoá / mở khoá
    // =====================
    static async updateStatus(id, isActive) {
        const pool = await getPool();
        await pool.request()
            .input("Id", sql.Int, id)
            .input("IsActive", sql.Bit, isActive)
            .query(`
      UPDATE Users
      SET IsActive = @IsActive
      WHERE Id = @Id
    `);

        return { message: "Cập nhật trạng thái thành công" };
    }


    // =====================
    // 6) Xóa khách hàng
    // =====================
    static async delete(id) {
        const pool = await getPool();
        await pool.request()
            .input("Id", sql.Int, id)
            .query(`DELETE FROM Users WHERE Id=@Id`);

        return { message: "Xóa khách hàng thành công" };
    }
}

module.exports = AdminCustomerService;
