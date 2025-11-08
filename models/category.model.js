// src/models/category.model.js
const { sql, getPool } = require("../config/db");

class CategoryModel {
  // 🔹 Lấy tất cả danh mục
  static async getAll() {
    const pool = await getPool();
    const res = await pool.request().query("SELECT * FROM Categories ORDER BY Name ASC");
    return res.recordset;  // ✅ trả về tất cả danh mục
  }

  // 🔹 Lấy danh mục theo ID
  static async getById(id) {
    const pool = await getPool();
    const res = await pool
      .request()
      .input("Id", sql.Int, id)
      .query("SELECT * FROM Categories WHERE Id=@Id");

    return res.recordset[0] || null;  // ✅ Trả về bản ghi nếu tồn tại, không có trả null
  }

  // 🔹 Tạo danh mục mới
  static async create(name) {
    const pool = await getPool();
    const res = await pool
      .request()
      .input("Name", sql.NVarChar, name)
      .query(`
        INSERT INTO Categories (Name)
        OUTPUT INSERTED.*
        VALUES (@Name)
      `);
    
    return res.recordset[0];  // ✅ Trả về bản ghi vừa được tạo, bao gồm cả ID
  }

  // 🔹 Cập nhật danh mục
  static async update(id, name) {
    const pool = await getPool();
    const res = await pool
      .request()
      .input("Id", sql.Int, id)
      .input("Name", sql.NVarChar, name)
      .query(`
        UPDATE Categories
        SET Name=@Name
        OUTPUT INSERTED.*
        WHERE Id=@Id
      `);
    
    return res.recordset[0];  // ✅ Trả về bản ghi cập nhật
  }

  // 🔹 Xóa danh mục
  static async delete(id) {
    const pool = await getPool();
    const res = await pool
      .request()
      .input("Id", sql.Int, id)
      .query("DELETE FROM Categories WHERE Id=@Id");

    // ✅ Trả về thông tin đã xóa (có thể sử dụng hoặc bỏ tùy nhu cầu)
    return { ok: true, id };  
  }
}

module.exports = CategoryModel;
