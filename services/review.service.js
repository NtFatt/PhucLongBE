// services/review.service.js
const { sql, getPool } = require("../config/db");

class ReviewService {
  static async upsert(userId, productId, rating, comment, extra = {}) {
    const pool = await getPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const { serviceRating, deliveryRating, driverRating, tags, images } = extra;

      console.log("🧩 Bắt đầu upsert review:", { userId, productId, rating, comment, extra });

      // 1️⃣ Kiểm tra sản phẩm tồn tại
      const checkProduct = await new sql.Request(tx)
        .input("ProductId", sql.Int, productId)
        .query("SELECT Id FROM Products WHERE Id=@ProductId");

      if (!checkProduct.recordset.length) {
        await tx.rollback();
        return { ok: false, error: "PRODUCT_NOT_FOUND" };
      }

      // 2️⃣ Kiểm tra review cũ
      const existing = await new sql.Request(tx)
        .input("UserId", sql.Int, userId)
        .input("ProductId", sql.Int, productId)
        .query("SELECT Id FROM ProductReviews WHERE UserId=@UserId AND ProductId=@ProductId");

      // 3️⃣ Update hoặc Insert
      if (existing.recordset.length > 0) {
        console.log("🟨 Cập nhật review cũ...");
        await new sql.Request(tx)
          .input("UserId", sql.Int, userId)
          .input("ProductId", sql.Int, productId)
          .input("Rating", sql.Int, rating)
          .input("ServiceRating", sql.Int, serviceRating)
          .input("DeliveryRating", sql.Int, deliveryRating)
          .input("DriverRating", sql.Int, driverRating)
          .input("Tags", sql.NVarChar(sql.MAX), JSON.stringify(tags || []))
          .input("Images", sql.NVarChar(sql.MAX), JSON.stringify(images || []))
          .input("Comment", sql.NVarChar(sql.MAX), comment)
          .query(`
          UPDATE ProductReviews
          SET Rating=@Rating,
              ServiceRating=@ServiceRating,
              DeliveryRating=@DeliveryRating,
              DriverRating=@DriverRating,
              Tags=@Tags,
              Images=@Images,
              Comment=@Comment,
              UpdatedAt=SYSUTCDATETIME()
          WHERE UserId=@UserId AND ProductId=@ProductId
        `);
      } else {
        console.log("🟩 Thêm review mới...");
        await new sql.Request(tx)
          .input("UserId", sql.Int, userId)
          .input("ProductId", sql.Int, productId)
          .input("Rating", sql.Int, rating)
          .input("ServiceRating", sql.Int, serviceRating)
          .input("DeliveryRating", sql.Int, deliveryRating)
          .input("DriverRating", sql.Int, driverRating)
          .input("Tags", sql.NVarChar(sql.MAX), JSON.stringify(tags || []))
          .input("Images", sql.NVarChar(sql.MAX), JSON.stringify(images || []))
          .input("Comment", sql.NVarChar(sql.MAX), comment)
          .query(`
          INSERT INTO ProductReviews
          (ProductId, UserId, Rating, ServiceRating, DeliveryRating, DriverRating, Tags, Images, Comment, IsVisible, CreatedAt, UpdatedAt)
          VALUES (@ProductId, @UserId, @Rating, @ServiceRating, @DeliveryRating, @DriverRating, @Tags, @Images, @Comment, 1, SYSUTCDATETIME(), SYSUTCDATETIME())
        `);
      }

      await tx.commit();
      console.log("✅ Đã commit thành công review vào DB!");
      return { ok: true, message: "Review saved successfully" };
    } catch (err) {
      console.error("❌ Lỗi khi upsert review:", err);
      try { await tx.rollback(); } catch { }
      return { ok: false, error: err.message };
    }
  }


  // =============== Phần còn lại giữ nguyên =================
  static async listByProduct(productId) {
    const pool = await getPool();
    const result = await pool.request()
      .input("ProductId", sql.Int, productId)
      .query(`
        SELECT pr.*, u.Name AS UserName
        FROM ProductReviews pr
        JOIN Users u ON pr.UserId=u.Id
        WHERE pr.ProductId=@ProductId AND (pr.IsVisible=1 OR pr.IsVisible IS NULL)
        ORDER BY pr.CreatedAt DESC
      `);
    return result.recordset;
  }

  static async listAll(filter = {}) {
    const pool = await getPool();
    let query = `
      SELECT pr.*, u.Name AS UserName, p.Name AS ProductName
      FROM ProductReviews pr
      JOIN Users u ON pr.UserId=u.Id
      JOIN Products p ON pr.ProductId=p.Id
      WHERE 1=1
    `;
    const req = pool.request();
    if (filter.isVisible != null) {
      query += " AND pr.IsVisible=@IsVisible";
      req.input("IsVisible", sql.Bit, filter.isVisible);
    }
    query += " ORDER BY pr.CreatedAt DESC";
    const result = await req.query(query);
    return result.recordset;
  }

  static async updateByAdmin(id, fields) {
    const pool = await getPool();
    const req = pool.request().input("Id", sql.Int, id);
    const set = [];
    if (fields.rating != null) {
      req.input("Rating", sql.Int, fields.rating);
      set.push("Rating=@Rating");
    }
    if (fields.comment != null) {
      req.input("Comment", sql.NVarChar, fields.comment);
      set.push("Comment=@Comment");
    }
    if (fields.isVisible != null) {
      req.input("IsVisible", sql.Bit, fields.isVisible);
      set.push("IsVisible=@IsVisible");
    }
    if (!set.length) return { ok: false, error: "NO_FIELDS" };
    await req.query(`UPDATE ProductReviews SET ${set.join(", ")} WHERE Id=@Id`);
    return { ok: true };
  }

  static async delete(id, userId = null, isAdmin = false) {
    const pool = await getPool();
    const req = pool.request().input("Id", sql.Int, id);
    let query = "DELETE FROM ProductReviews WHERE Id=@Id";
    if (!isAdmin) {
      req.input("UserId", sql.Int, userId);
      query += " AND UserId=@UserId";
    }
    const result = await req.query(query);
    return { ok: result.rowsAffected[0] > 0 };
  }
}

module.exports = ReviewService;
