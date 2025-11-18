const { sql, getPool } = require("../../config/db");

class AdminOrderService {
  // ✅ Lấy toàn bộ đơn hàng kèm danh sách sản phẩm
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
  u.Name AS CustomerName,
  u.Phone,
  STRING_AGG(
    CASE 
      WHEN p.Name IS NOT NULL THEN CONCAT(p.Name, ' (x', oi.Quantity, ')')
      ELSE '(Sản phẩm không tồn tại)'
    END, ', '
  ) AS ProductList
FROM Orders o
JOIN Users u ON o.UserId = u.Id
LEFT JOIN OrderItems oi ON o.Id = oi.OrderId
LEFT JOIN Products p ON oi.ProductId = p.Id
GROUP BY o.Id, o.Total, o.PaymentMethod, o.Status, o.CreatedAt, u.Name, u.Phone
ORDER BY o.CreatedAt DESC
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

    try {
      const pool = await getPool();
      await pool.request()
        .input("Id", sql.Int, orderId)
        .input("Status", sql.NVarChar, status)
        .query("UPDATE Orders SET Status = @Status WHERE Id = @Id");

      return { message: `✅ Đơn hàng #${orderId} đã được cập nhật trạng thái thành "${status}"` };
    } catch (err) {
      console.error(`❌ Lỗi cập nhật trạng thái đơn hàng #${orderId}:`, err);
      throw err;
    }
  }

  // ✅ Xóa đơn hàng
  static async delete(id) {
    try {
      const pool = await getPool();
      await pool.request()
        .input("Id", sql.Int, id)
        .query("DELETE FROM Orders WHERE Id = @Id");

      return { message: `🗑️ Đã xóa đơn hàng #${id}` };
    } catch (err) {
      console.error(`❌ Lỗi khi xóa đơn hàng #${id}:`, err);
      throw err;
    }
  }
}

module.exports = AdminOrderService;
