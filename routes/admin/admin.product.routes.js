// =============================================================
// 🧩 Admin Product Routes
// -------------------------------------------------------------
// ✅ GET    /api/admin/products        → Lấy danh sách sản phẩm
// ✅ POST   /api/admin/products        → Thêm sản phẩm mới
// ✅ PUT    /api/admin/products/:id    → Cập nhật sản phẩm
// ✅ DELETE /api/admin/products/:id    → Xóa sản phẩm
// =============================================================

const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { getPool } = require("../../config/db");

// =============================================================
// 📦 Lấy danh sách sản phẩm
// =============================================================
router.get("/", async (req, res) => {
  try {
    const pool = await getPool();
    const rs = await pool.request().query(`
      SELECT 
        Id AS id,
        Name AS name,
        Description AS description,
        Price AS price,
        ImageUrl AS image,
        Stock AS stock,
        CategoryName AS categoryName,
        Bestseller,
        OutOfStock,
        AverageRating
      FROM Products
      ORDER BY Id DESC
    `);

    res.json({ ok: true, data: rs.recordset });
  } catch (err) {
    console.error("❌ [AdminRoute] Lỗi khi lấy sản phẩm:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// =============================================================
// ➕ Thêm sản phẩm mới
// =============================================================
router.post("/", async (req, res) => {
  try {
    console.log("📩 [AdminRoute] Body nhận từ FE:", req.body);

    // Chuẩn hóa cả key viết hoa và viết thường
    const {
      name,
      Name,
      description,
      Description,
      price,
      Price,
      imageUrl,
      ImageUrl,
      stock,
      Stock,
      categoryName,
      CategoryName,
    } = req.body;

    const finalName = Name || name;
    const finalPrice = Price || price;
    const finalDesc = Description || description || "";
    const finalImg = ImageUrl || imageUrl || "";
    const finalStock = Stock || stock || 0;
    const finalCategory = CategoryName || categoryName || "Chưa phân loại";

    if (!finalName || !finalPrice) {
      console.warn("⚠️ Thiếu tên hoặc giá sản phẩm sau chuẩn hóa:", req.body);
      return res
        .status(400)
        .json({ ok: false, error: "Thiếu tên hoặc giá sản phẩm" });
    }

    const pool = await getPool();
    await pool
      .request()
      .input("Name", sql.NVarChar, finalName)
      .input("Description", sql.NVarChar, finalDesc)
      .input("Price", sql.Float, finalPrice)
      .input("ImageUrl", sql.NVarChar, finalImg)
      .input("Stock", sql.Int, finalStock)
      .input("CategoryName", sql.NVarChar, finalCategory)
      .query(`
        INSERT INTO Products (Name, Description, Price, ImageUrl, Stock, CategoryName)
        VALUES (@Name, @Description, @Price, @ImageUrl, @Stock, @CategoryName)
      `);

    console.log("✅ [AdminRoute] Thêm sản phẩm thành công:", finalName);
    res.json({ ok: true, message: "Thêm sản phẩm thành công" });
  } catch (err) {
    console.error("🔥 [AdminRoute] Lỗi khi thêm sản phẩm:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// =============================================================
// ✏️ Cập nhật sản phẩm
// =============================================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      Name,
      description,
      Description,
      price,
      Price,
      imageUrl,
      ImageUrl,
      stock,
      Stock,
      categoryName,
      CategoryName,
    } = req.body;

    const finalName = Name || name;
    const finalPrice = Price || price;
    const finalDesc = Description || description || "";
    const finalImg = ImageUrl || imageUrl || "";
    const finalStock = Stock || stock || 0;
    const finalCategory = CategoryName || categoryName || "Chưa phân loại";

    if (!finalName || !finalPrice) {
      console.warn("⚠️ Thiếu tên hoặc giá khi cập nhật:", req.body);
      return res
        .status(400)
        .json({ ok: false, error: "Thiếu tên hoặc giá sản phẩm" });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .input("Name", sql.NVarChar, finalName)
      .input("Description", sql.NVarChar, finalDesc)
      .input("Price", sql.Float, finalPrice)
      .input("ImageUrl", sql.NVarChar, finalImg)
      .input("Stock", sql.Int, finalStock)
      .input("CategoryName", sql.NVarChar, finalCategory)
      .query(`
        UPDATE Products
        SET 
          Name = @Name,
          Description = @Description,
          Price = @Price,
          ImageUrl = @ImageUrl,
          Stock = @Stock,
          CategoryName = @CategoryName
        WHERE Id = @Id
      `);

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ ok: false, error: "Không tìm thấy sản phẩm" });

    console.log("✅ [AdminRoute] Cập nhật sản phẩm thành công:", finalName);
    res.json({ ok: true, message: "Cập nhật sản phẩm thành công" });
  } catch (err) {
    console.error("❌ [AdminRoute] Lỗi khi cập nhật sản phẩm:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// =============================================================
// 🗑️ Xóa sản phẩm
// =============================================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool
      .request()
      .input("Id", sql.Int, id)
      .query("DELETE FROM Products WHERE Id = @Id");

    if (result.rowsAffected[0] === 0)
      return res
        .status(404)
        .json({ ok: false, error: "Không tìm thấy sản phẩm" });

    console.log("🗑️ [AdminRoute] Đã xóa sản phẩm:", id);
    res.json({ ok: true, message: "Đã xóa sản phẩm thành công" });
  } catch (err) {
    console.error("❌ [AdminRoute] Lỗi khi xóa sản phẩm:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
