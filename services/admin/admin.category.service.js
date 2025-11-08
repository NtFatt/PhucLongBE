const { getPool } = require("../../config/db");

class CategoryModel {
  // 🔹 Lấy tất cả danh mục
  static async getAll() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT Id AS id, Name AS name
      FROM Categories
      ORDER BY Name ASC
    `);
    return result.recordset;
  }

  // 🔹 Lấy theo ID
  static async getById(id) {
    const pool = await getPool();
    const result = await pool.request()
      .input("Id", id)
      .query("SELECT Id AS id, Name AS name FROM Categories WHERE Id=@Id");
    return result.recordset[0];
  }

  // 🔹 Tạo danh mục mới
  static async create(name) {
    const pool = await getPool();
    await pool.request()
      .input("Name", name)
      .query("INSERT INTO Categories (Name) VALUES (@Name)");
    return { id: null, name };
  }

  // 🔹 Cập nhật danh mục
  static async update(id, name) {
    const pool = await getPool();
    await pool.request()
      .input("Id", id)
      .input("Name", name)
      .query("UPDATE Categories SET Name=@Name WHERE Id=@Id");
    return { id, name };
  }

  // 🔹 Xóa danh mục
  static async delete(id) {
    const pool = await getPool();
    await pool.request()
      .input("Id", id)
      .query("DELETE FROM Categories WHERE Id=@Id");
  }
}

module.exports = CategoryModel;
