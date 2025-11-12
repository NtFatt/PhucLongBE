// ======================================================
// 📦 AdminInventoryService.js
// ------------------------------------------------------
// ✅ Quản lý nguyên liệu trong bảng Inventories
// ======================================================

const { sql, getPool } = require("../../config/db");

class AdminInventoryService {
  // ======================================================
  // 🟢 Thêm nguyên liệu mới vào kho
  // ======================================================
  static async addItem(data) {
    const pool = await getPool();

    await pool.request()
      .input("Name", sql.NVarChar(255), data.name)
      .input("Category", sql.NVarChar(100), data.category)
      .input("Quantity", sql.Decimal(10, 2), data.quantity ?? 0)
      .input("Unit", sql.NVarChar(50), data.unit)
      .input("MinStock", sql.Decimal(10, 2), data.minStock ?? 0)
      .input("Price", sql.Decimal(18, 2), data.price ?? 0)
      .input("Supplier", sql.NVarChar(255), data.supplier || "Không rõ nhà cung cấp")
      .query(`
        INSERT INTO Inventories 
          (Name, Category, Quantity, Unit, MinStock, Price, Supplier, LastUpdated)
        VALUES 
          (@Name, @Category, @Quantity, @Unit, @MinStock, @Price, @Supplier, GETDATE())
      `);

    return { ok: true, message: "✅ Đã thêm nguyên liệu mới vào Inventories" };
  }

  // ======================================================
  // 🟢 Lấy toàn bộ danh sách nguyên liệu
  // ======================================================
  static async getAll() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        Id,
        Name,
        Category,
        ISNULL(Quantity, 0) AS Quantity,
        Unit,
        ISNULL(MinStock, 0) AS MinStock,
        ISNULL(Price, 0) AS Price,
        ISNULL(Supplier, N'Không rõ nhà cung cấp') AS Supplier,
        FORMAT(ISNULL(LastUpdated, GETDATE()), 'yyyy-MM-dd') AS LastUpdated
      FROM Inventories
      ORDER BY LastUpdated DESC
    `);

    // Chuẩn hóa dữ liệu để FE đọc đúng key (category, unit, quantity...)
    return result.recordset.map((i) => ({
      id: i.Id,
      name: i.Name,
      category: i.Category,     // ✅ FE dùng để lọc
      quantity: i.Quantity,
      unit: i.Unit,
      minStock: i.MinStock,
      price: i.Price,
      supplier: i.Supplier,
      lastUpdated: i.LastUpdated,
    }));
  }

  // ======================================================
  // 🟢 Cập nhật số lượng tồn kho (khi nhập hàng / xuất hàng)
  // ======================================================
  static async updateStock(id, quantity) {
    const pool = await getPool();
    await pool.request()
      .input("Id", sql.Int, id)
      .input("Quantity", sql.Decimal(10, 2), quantity)
      .query(`
        UPDATE Inventories 
        SET Quantity = @Quantity, LastUpdated = GETDATE()
        WHERE Id = @Id
      `);

    return { ok: true, message: `✅ Đã cập nhật tồn kho #${id}` };
  }

  // ======================================================
  // 🟢 Xóa nguyên liệu khỏi kho
  // ======================================================
  static async deleteItem(id) {
    const pool = await getPool();
    await pool.request()
      .input("Id", sql.Int, id)
      .query(`DELETE FROM Inventories WHERE Id = @Id`);

    return { ok: true, message: `🗑️ Đã xóa nguyên liệu #${id}` };
  }
}

module.exports = AdminInventoryService;
