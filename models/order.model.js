// ======================================================
// 📦 models/order.model.js
// ------------------------------------------------------
// ✅ Chuẩn hóa toàn bộ thao tác ghi đơn hàng & lịch sử
// ✅ Ghi Subtotal, ShippingFee, Total chính xác
// ✅ Dùng SYSUTCDATETIME() để thống nhất timezone
// ✅ Hoạt động ổn định trong transaction (tx)
// ======================================================

const { sql, getPool } = require("../config/db");

class OrderModel {
  // ==================================================
  // 🧾 Tạo đơn hàng mới
  // ==================================================
  static async insertOrder(tx, data) {
    const req = tx.request();

    req.input("UserId", sql.Int, data.UserId);
    req.input("Subtotal", sql.Decimal(18, 2), data.Subtotal || 0);
    req.input("Total", sql.Decimal(18, 2), data.Total);
    req.input("PaymentMethod", sql.NVarChar(50), data.PaymentMethod || "COD");
    req.input("PaymentStatus", sql.NVarChar(50), data.PaymentStatus || "unpaid");
    req.input("Status", sql.NVarChar(50), data.Status || "pending");
    req.input("FulfillmentMethod", sql.NVarChar(50), data.FulfillmentMethod || "delivery");
    req.input("DeliveryAddress", sql.NVarChar(255), data.DeliveryAddress || null);
    req.input("DeliveryLat", sql.Float, data.DeliveryLat ?? null);
    req.input("DeliveryLng", sql.Float, data.DeliveryLng ?? null);
    req.input("StoreId", sql.Int, data.StoreId ?? null);
    req.input("ShippingFee", sql.Decimal(18, 2), data.ShippingFee || 0);

    const result = await req.query(`
      INSERT INTO Orders (
        UserId, Subtotal, Total, PaymentMethod, PaymentStatus, Status,
        FulfillmentMethod, DeliveryAddress, DeliveryLat, DeliveryLng,
        StoreId, ShippingFee, CreatedAt
      )
      OUTPUT Inserted.Id
      VALUES (
        @UserId, @Subtotal, @Total, @PaymentMethod, @PaymentStatus, @Status,
        @FulfillmentMethod, @DeliveryAddress, @DeliveryLat, @DeliveryLng,
        @StoreId, @ShippingFee, SYSUTCDATETIME()
      )
    `);

    const orderId = result.recordset[0]?.Id;
    if (!orderId) throw new Error("❌ Lỗi: Không thể tạo đơn hàng mới (INSERT thất bại)");

    console.log("✅ [OrderModel] Đã tạo đơn hàng:", orderId);
    return orderId;
  }

  // ==================================================
  // 🧾 Thêm từng sản phẩm vào OrderItems
  // ==================================================
  static async insertOrderItem(tx, item) {
    await tx.request()
      .input("OrderId", sql.Int, item.OrderId)
      .input("ProductId", sql.Int, item.ProductId)
      .input("Quantity", sql.Int, item.Quantity)
      .input("Price", sql.Decimal(18, 2), item.Price)
      .input("Size", sql.NVarChar(50), item.Size || null)
      .input("Sugar", sql.NVarChar(50), item.Sugar || null)
      .input("Ice", sql.NVarChar(50), item.Ice || null)
      .input("Topping", sql.NVarChar(255), item.Topping || null)
      .query(`
        INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price, Size, Sugar, Ice, Topping)
        VALUES (@OrderId, @ProductId, @Quantity, @Price, @Size, @Sugar, @Ice, @Topping)
      `);

    console.log("🛒 [OrderModel] + Added item cho OrderId:", item.OrderId);
  }

  // ==================================================
  // 📋 Lấy danh sách đơn theo User
  // ==================================================
  static async getOrdersByUser(userId) {
    const pool = await getPool();
    const res = await pool
      .request()
      .input("UserId", sql.Int, userId)
      .query(`
        SELECT * 
        FROM Orders
        WHERE UserId = @UserId
        ORDER BY CreatedAt DESC
      `);
    return res.recordset;
  }

  // ==================================================
  // 🧾 Lấy danh sách sản phẩm trong 1 đơn hàng
  // ==================================================
  static async getOrderItems(orderId) {
    const pool = await getPool();
    const res = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .query(`
        SELECT 
          oi.Id,
          oi.ProductId,
          oi.Quantity,
          oi.Price,
          oi.Size,
          oi.Sugar,
          oi.Ice,
          oi.Topping,
          p.Name AS ProductName,
          p.ImageUrl
        FROM OrderItems oi
        JOIN Products p ON oi.ProductId = p.Id
        WHERE oi.OrderId = @OrderId
      `);
    return res.recordset;
  }

  // ==================================================
  // 🧾 Lấy toàn bộ đơn hàng (cho Admin Dashboard)
  // ==================================================
  static async getAllOrders() {
    const pool = await getPool();
    const res = await pool.request().query(`
      SELECT o.*, u.FullName AS CustomerName, u.Email
      FROM Orders o
      JOIN Users u ON o.UserId = u.Id
      ORDER BY o.CreatedAt DESC
    `);
    return res.recordset;
  }

  // ==================================================
  // ⚙️ Cập nhật trạng thái đơn hàng
  // ==================================================
  static async updateStatus(orderId, status, paymentStatus = null) {
    const pool = await getPool();
    const req = pool.request()
      .input("Id", sql.Int, orderId)
      .input("Status", sql.NVarChar(50), status);

    let query = `UPDATE Orders SET Status = @Status`;

    if (paymentStatus) {
      req.input("PaymentStatus", sql.NVarChar(50), paymentStatus);
      query += `, PaymentStatus = @PaymentStatus`;
    }

    query += ` WHERE Id = @Id`;
    await req.query(query);

    console.log("🔄 [OrderModel] Cập nhật trạng thái:", orderId, "->", status);
  }

  // ==================================================
  // 🧾 Lấy chi tiết đơn hàng theo ID
  // ==================================================
  static async getOrderById(orderId) {
    const pool = await getPool();
    const res = await pool.request()
      .input("Id", sql.Int, orderId)
      .query(`SELECT * FROM Orders WHERE Id = @Id`);
    return res.recordset[0] || null;
  }

  // ==================================================
  // 🕓 Ghi lịch sử trạng thái đơn hàng (OrderHistory)
  // ==================================================
  static async insertOrderHistory(tx, data) {
    const req = tx.request();
    req.input("OrderId", sql.Int, data.OrderId);
    req.input("OldStatus", sql.NVarChar(50), data.OldStatus || null);
    req.input("NewStatus", sql.NVarChar(50), data.NewStatus);

    await req.query(`
      INSERT INTO OrderHistory (OrderId, OldStatus, NewStatus, ChangedAt)
      VALUES (@OrderId, @OldStatus, @NewStatus, SYSUTCDATETIME())
    `);

    console.log("🕓 [OrderModel] Ghi OrderHistory:", data.OrderId, data.NewStatus);
  }
}

module.exports = OrderModel;
