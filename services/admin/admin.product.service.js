const { sql, getPool } = require("../../config/db");

class AdminProductService {
  // ======================================================
  // 📦 Lấy danh sách sản phẩm
  // ======================================================
  static async getAll() {
    const pool = await getPool();
    const res = await pool.request().query(`
      SELECT 
        Id, 
        Name, 
        Description,
        Price, 
        Stock, 
        CategoryName,   -- dùng CategoryName làm text
        ImageUrl
      FROM Products 
      ORDER BY Id DESC
    `);
    return res.recordset;
  }

  // ======================================================
  // 🔍 Lấy chi tiết sản phẩm
  // ======================================================
  static async getById(id) {
    const pool = await getPool();
    const res = await pool
      .request()
      .input("Id", sql.Int, id)
      .query(`
        SELECT 
          Id, Name, Description, Price, Stock, CategoryName, ImageUrl
        FROM Products
        WHERE Id = @Id
      `);

    if (!res.recordset.length) throw new Error("Không tìm thấy sản phẩm");
    return res.recordset[0];
  }

  // ======================================================
  // 🧠 TÍNH SỐ LƯỢNG TỐI ĐA CÓ THỂ SẢN XUẤT TỪ KHO
  // ======================================================
  static async getMaxAvailableFromInventory(productId) {
    const pool = await getPool();
    const res = await pool
      .request()
      .input("ProductId", sql.Int, productId)
      .query(`
        SELECT 
          pr.QuantityPerProduct, 
          i.Quantity AS InventoryQty
        FROM ProductRecipes pr
        JOIN Inventories i ON pr.InventoryId = i.Id
        WHERE pr.ProductId = @ProductId
      `);

    if (!res.recordset.length) return null; // chưa có công thức
    let maxPossible = Infinity;

    for (const row of res.recordset) {
      const qtyPerProduct = Number(row.QuantityPerProduct || 0);
      const inventoryQty = Number(row.InventoryQty || 0);
      if (qtyPerProduct <= 0) continue;
      const possible = inventoryQty / qtyPerProduct;
      if (possible < maxPossible) maxPossible = possible;
    }

    return isFinite(maxPossible) ? Math.floor(maxPossible) : null;
  }

  // ======================================================
  // 🛡️ KIỂM TRA KHÔNG CHO VƯỢT GIỚI HẠN TỒN
  // ======================================================
  static async ensureStockNotExceedInventory(productId, requestedStock) {
    const stockValue = Number(requestedStock || 0);
    const maxAvailable = await this.getMaxAvailableFromInventory(productId);
    if (maxAvailable === null) return; // chưa có công thức => bỏ qua
    if (stockValue > maxAvailable) {
      const err = new Error(
        `Tồn kho nguyên liệu chỉ đủ để sản xuất tối đa ${maxAvailable} sản phẩm.`
      );
      err.code = "STOCK_EXCEED_MAX_AVAILABLE";
      throw err;
    }
  }

  // ======================================================
  // ➕ Tạo sản phẩm mới
  // ======================================================
  static async create({ Name, Description, Price, Stock, CategoryName, ImageUrl }) {
    const pool = await getPool();
    await pool
      .request()
      .input("Name", sql.NVarChar(255), Name)
      .input("Description", sql.NVarChar(sql.MAX), Description || "")
      .input("Price", sql.Decimal(18, 2), Price)
      .input("Stock", sql.Int, Stock || 0)
      .input("CategoryName", sql.NVarChar(100), CategoryName || "Chưa phân loại")
      .input("ImageUrl", sql.NVarChar(500), ImageUrl || "")
      .query(`
        INSERT INTO Products (Name, Description, Price, Stock, CategoryName, ImageUrl)
        VALUES (@Name, @Description, @Price, @Stock, @CategoryName, @ImageUrl)
      `);
    return { message: "✅ Đã thêm sản phẩm mới" };
  }

  // ======================================================
  // ✏️ Cập nhật sản phẩm
  // ======================================================
  static async update(id, { Name, Description, Price, Stock, CategoryName, ImageUrl }) {
    const pool = await getPool();

    await this.ensureStockNotExceedInventory(id, Stock);

    await pool
      .request()
      .input("Id", sql.Int, id)
      .input("Name", sql.NVarChar(255), Name)
      .input("Description", sql.NVarChar(sql.MAX), Description || "")
      .input("Price", sql.Decimal(18, 2), Price)
      .input("Stock", sql.Int, Stock || 0)
      .input("CategoryName", sql.NVarChar(100), CategoryName || "Chưa phân loại")
      .input("ImageUrl", sql.NVarChar(500), ImageUrl || "")
      .query(`
        UPDATE Products
        SET 
          Name = @Name,
          Description = @Description,
          Price = @Price,
          Stock = @Stock,
          CategoryName = @CategoryName,
          ImageUrl = @ImageUrl
        WHERE Id = @Id
      `);

    return { message: "✅ Cập nhật sản phẩm thành công" };
  }

  // ======================================================
  // 🗑️ Xóa sản phẩm
  // ======================================================
  static async delete(id) {
    const pool = await getPool();
    await pool.request().input("Id", sql.Int, id).query(`
      DELETE FROM Products WHERE Id = @Id
    `);
    return { message: "🗑️ Đã xóa sản phẩm" };
  }
}

module.exports = AdminProductService;
