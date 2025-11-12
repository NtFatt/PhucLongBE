// src/models/category.model.js
const { sql, getPool } = require("../config/db");

class CategoryModel {
  // 🔹 Lấy tất cả danh mục
  static async getAll() {
    const pool = await getPool();
    const res = await pool.request().query(`
      SELECT Name
      FROM Categories
      ORDER BY Name ASC
    `);
    return res.recordset;
  }

  // 🔹 Lấy danh mục theo tên
  static async getByName(name) {
    const pool = await getPool();
    const res = await pool
      .request()
      .input("Name", sql.NVarChar(100), name)
      .query(`
        SELECT Name 
        FROM Categories
        WHERE Name = @Name
      `);
    return res.recordset[0] || null;
  }

  // 🔹 Tạo danh mục mới
  static async create(name) {
    const pool = await getPool();
    const res = await pool
      .request()
      .input("Name", sql.NVarChar(100), name)
      .query(`
        INSERT INTO Categories (Name)
        OUTPUT INSERTED.Name
        VALUES (@Name)
      `);
    return res.recordset[0];
  }

  // 🔹 Cập nhật tên danh mục (đổi tên)
  static async update(oldName, newName) {
    const pool = await getPool();
    const res = await pool
      .request()
      .input("OldName", sql.NVarChar(100), oldName)
      .input("NewName", sql.NVarChar(100), newName)
      .query(`
        UPDATE Categories
        SET Name = @NewName
        OUTPUT INSERTED.Name
        WHERE Name = @OldName
      `);
    return res.recordset[0];
  }

  // 🔹 Xóa danh mục theo tên
  static async delete(name) {
    const pool = await getPool();
    await pool
      .request()
      .input("Name", sql.NVarChar(100), name)
      .query("DELETE FROM Categories WHERE Name = @Name");
    return { message: `Đã xóa danh mục '${name}'` };
  }
}

module.exports = CategoryModel;
