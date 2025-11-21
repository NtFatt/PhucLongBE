const { sql, getPool } = require("../../config/db");
const bcrypt = require("bcryptjs");

class AdminEmployeeService {
  // ============================
  // 1) Get toàn bộ nhân viên
  // ============================
  static async getAll() {
    const pool = await getPool();
    const rs = await pool.request().query(`
      SELECT 
        Id, Name, Email, Phone, Role, IsActive, CreatedAt
      FROM Employees
      ORDER BY CreatedAt DESC
    `);
    return rs.recordset;
  }

  // ============================
  // 2) Tạo nhân viên
  // ============================
  static async create(data) {
    const { name, email, phone, password, role } = data;

    if (!password) throw new Error("Mật khẩu không được bỏ trống");

    const hashed = await bcrypt.hash(password, 10);

    const pool = await getPool();
    await pool.request()
      .input("Name", sql.NVarChar, name)
      .input("Email", sql.NVarChar, email)
      .input("Phone", sql.NVarChar, phone)
      .input("PasswordHash", sql.NVarChar, hashed)
      .input("Role", sql.NVarChar, role)
      .query(`
        INSERT INTO Employees (Name, Email, Phone, PasswordHash, Role, IsActive, CreatedAt)
        VALUES (@Name, @Email, @Phone, @PasswordHash, @Role, 1, GETDATE())
      `);

    return { message: "Thêm nhân viên thành công" };
  }

  // ============================
  // 3) Cập nhật nhân viên
  // ============================
  static async update(id, data) {
    const { name, email, phone, role } = data;

    const pool = await getPool();
    await pool.request()
      .input("Id", sql.Int, id)
      .input("Name", sql.NVarChar, name)
      .input("Email", sql.NVarChar, email)
      .input("Phone", sql.NVarChar, phone)
      .input("Role", sql.NVarChar, role)
      .query(`
        UPDATE Employees
        SET Name=@Name, Email=@Email, Phone=@Phone, Role=@Role
        WHERE Id=@Id
      `);

    return { message: "Cập nhật nhân viên thành công" };
  }

  // ============================
  // 4) Cập nhật mật khẩu
  // ============================
  static async updatePassword(id, password) {
    const hashed = await bcrypt.hash(password, 10);

    const pool = await getPool();
    await pool.request()
      .input("Id", sql.Int, id)
      .input("PasswordHash", sql.NVarChar, hashed)
      .query(`
        UPDATE Employees
        SET PasswordHash=@PasswordHash
        WHERE Id=@Id
      `);

    return { message: "Đổi mật khẩu thành công" };
  }

  // ============================
  // 5) Ẩn / khóa account
  // ============================
  static async updateStatus(id, isActive) {
    const pool = await getPool();
    await pool.request()
      .input("Id", sql.Int, id)
      .input("IsActive", sql.Bit, isActive)
      .query(`
        UPDATE Employees
        SET IsActive=@IsActive
        WHERE Id=@Id
      `);

    return { message: "Cập nhật trạng thái thành công" };
  }

  // ============================
  // 6) Xoá nhân viên
  // ============================
  static async delete(id) {
    const pool = await getPool();
    await pool.request()
      .input("Id", sql.Int, id)
      .query(`
        DELETE FROM Employees WHERE Id=@Id
      `);

    return { message: "Xoá nhân viên thành công" };
  }
}

module.exports = AdminEmployeeService;
