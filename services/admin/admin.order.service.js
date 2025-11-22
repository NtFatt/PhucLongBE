const { sql, getPool } = require("../../config/db");

class AdminOrderService {
  // ✅ Lấy toàn bộ đơn hàng kèm danh sách sản phẩm từ cả POS & WEB
  static async getAll() {
    try {
      const pool = await getPool();

      const res = await pool.request().query(`
        SELECT 
          o.Id,
          o.Total,
          o.PaymentMethod,
          o.Status,
          o.CreatedAt,
          u.Name  AS CustomerName,
          u.Phone,

          STRING_AGG(
            COALESCE(
              -- Đơn từ POS: OrderItems
              CASE 
                WHEN p_oi.Name IS NOT NULL 
                THEN CONCAT(p_oi.Name, ' (x', oi.Quantity, ')')
              END,
              -- Đơn từ WEB: OrderDetails
              CASE 
                WHEN p_od.Name IS NOT NULL 
                THEN CONCAT(p_od.Name, ' (x', od.Quantity, ')')
              END,
              -- Fallback nếu thật sự không tìm thấy sản phẩm
              N'(Sản phẩm không tồn tại)'
            ),
            ', '
          ) AS ProductList

        FROM Orders o
        JOIN Users u ON o.UserId = u.Id

        -- Chi tiết đơn từ POS (POS Order)
        LEFT JOIN OrderItems oi     ON o.Id = oi.OrderId
        LEFT JOIN Products  p_oi    ON oi.ProductId = p_oi.Id

        -- Chi tiết đơn từ Web (PLFE)
        LEFT JOIN OrderDetails od   ON o.Id = od.OrderId
        LEFT JOIN Products  p_od    ON od.ProductId = p_od.Id

        GROUP BY 
          o.Id,
          o.Total,
          o.PaymentMethod,
          o.Status,
          o.CreatedAt,
          u.Name,
          u.Phone

        ORDER BY o.CreatedAt DESC;
      `);

      console.log("📦 Orders fetched:", res.recordset.length, "đơn hàng");
      return res.recordset;
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách đơn hàng:", err);
      return [];
    }
  }

  // ✅ Cập nhật trạng thái đơn hàng
  static async updateStatus(orderId, status) {
    const valid = ["pending", "confirmed", "processing", "completed", "cancelled"];
    if (!valid.includes(status)) throw new Error("Trạng thái không hợp lệ");

    const pool = await getPool();
    await pool.request()
      .input("Id", sql.Int, orderId)
      .input("Status", sql.NVarChar, status)
      .query("UPDATE Orders SET Status = @Status WHERE Id = @Id");

    return { message: `✅ Đơn hàng #${orderId} đã được cập nhật trạng thái thành "${status}"` };
  }

  // ✅ Xóa đơn hàng
  static async delete(id) {
    const pool = await getPool();
    await pool.request()
      .input("Id", sql.Int, id)
      .query("DELETE FROM Orders WHERE Id = @Id");

    return { message: `🗑️ Đã xóa đơn hàng #${id}` };
  }
}

module.exports = AdminOrderService;
