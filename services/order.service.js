// ======================================================
// 🧠 services/order.service.js
// ------------------------------------------------------
// Quản lý logic truy vấn SQL cho đơn hàng (MSSQL v11)
// ======================================================
const { sql, getPool } = require("../config/db");

class OrderService {
  // ======================================================
  // 🟢 Tạo đơn hàng mới
  // ======================================================
  async create(userId, orderData) {
    const { items, totalAmount, paymentMethod } = orderData;

    // 🔹 Lấy connection pool và tạo transaction
    const pool = await getPool();
    const connection = await pool.connect(); // ✅ MSSQL v11 yêu cầu explicit connect
    const transaction = new sql.Transaction(connection);

    try {
      await transaction.begin();
      console.log("🚀 [OrderService.create] Transaction bắt đầu...");

      // 1️⃣ Thêm đơn hàng chính
      const insertOrder = await new sql.Request(transaction)
        .input("UserId", sql.Int, userId)
        .input("StoreId", sql.Int, orderData.storeId || 1)
        .input("Subtotal", sql.Decimal(18, 2), orderData.items.reduce((sum, i) => sum + i.price * i.quantity, 0))
        .input("ShippingFee", sql.Decimal(18, 2), orderData.shippingFee || 0)
        .input("Total", sql.Decimal(18, 2),
          orderData.items.reduce((sum, i) => sum + i.price * i.quantity, 0) +
          (orderData.shippingFee || 0)
        )
        .input("PaymentMethod", sql.NVarChar(50), orderData.paymentMethod || "COD")
        .input("FulfillmentMethod", sql.NVarChar(50), orderData.pickupMethod || "Delivery")
        .input("DeliveryAddress", sql.NVarChar(255), orderData.shippingAddress || null)
        .input("DeliveryLat", sql.Float, orderData.lat || null)
        .input("DeliveryLng", sql.Float, orderData.lng || null)
        .input("Status", sql.NVarChar(50), "Pending")
        .query(`
    INSERT INTO Orders
    (UserId, StoreId, Subtotal, ShippingFee, Total, PaymentMethod, FulfillmentMethod,
     DeliveryAddress, DeliveryLat, DeliveryLng, Status)
    OUTPUT INSERTED.Id
    VALUES
    (@UserId, @StoreId, @Subtotal, @ShippingFee, @Total, @PaymentMethod, @FulfillmentMethod,
     @DeliveryAddress, @DeliveryLat, @DeliveryLng, @Status)
  `);


      const orderId = insertOrder.recordset[0].Id;
      console.log("🧾 Đơn hàng mới:", orderId);

      // 2️⃣ Thêm chi tiết sản phẩm
      for (const item of items) {
        await new sql.Request(transaction)
          .input("OrderId", sql.Int, orderId)
          .input("ProductId", sql.Int, item.productId)
          .input("Quantity", sql.Int, item.quantity)
          .input("UnitPrice", sql.Decimal(18, 2), item.price)
          .query(`
            INSERT INTO OrderDetails (OrderId, ProductId, Quantity, UnitPrice)
            VALUES (@OrderId, @ProductId, @Quantity, @UnitPrice)
          `);
      }

      // 3️⃣ Ghi vào lịch sử trạng thái (Pending)
      await new sql.Request(transaction)
        .input("OrderId", sql.Int, orderId)
        .input("OldStatus", sql.NVarChar(50), null)
        .input("NewStatus", sql.NVarChar(50), "Pending")
        .query(`
          INSERT INTO OrderHistory (OrderId, OldStatus, NewStatus)
          VALUES (@OrderId, @OldStatus, @NewStatus)
        `);

      await transaction.commit();
      console.log("✅ Transaction commit thành công!");
      return { orderId };
    } catch (err) {
      // ======================================================
      // 🛑 BẮT LỖI CHI TIẾT KHI TẠO ĐƠN HÀNG
      // ======================================================
      console.error("❌ [OrderService.create] Chi tiết lỗi SQL:", {
        message: err.message,
        code: err.code,
        number: err.number,
        lineNumber: err.lineNumber,
        state: err.state,
        class: err.class,
        procName: err.procName,
        stack: err.stack?.split("\n")[0], // in dòng đầu của stack trace
      });

      // ✅ Rollback an toàn
      try {
        if (transaction._aborted !== true) {
          await transaction.rollback();
          console.log("↩️ Transaction rollback hoàn tất");
        }
      } catch (rollbackErr) {
        console.error("⚠️ Rollback lỗi:", rollbackErr.message);
      }

      // 🔥 Ném lỗi chi tiết để controller xử lý (thay vì chuỗi tĩnh)
      throw new Error(err.message || "Lỗi khi tạo đơn hàng");
    } finally {
      // ======================================================
      // 🧹 ĐÓNG KẾT NỐI TRÁNH RÒ RỈ
      // ======================================================
      try {
        if (connection && connection.close) {
          await connection.close();
          console.log("🔒 Đóng kết nối SQL thành công!");
        }
      } catch (closeErr) {
        console.error("⚠️ Lỗi khi đóng connection:", closeErr.message);
      }
    }
  }

  // ======================================================
  // 🟢 Danh sách đơn hàng theo user
  // ======================================================
  async listByUser(userId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("UserId", sql.Int, userId)
      .query(`
        SELECT O.Id, O.TotalAmount, O.Status, O.OrderDate, O.PaymentMethod
        FROM Orders O
        WHERE O.UserId = @UserId
        ORDER BY O.OrderDate DESC
      `);
    return result.recordset;
  }

  // ======================================================
  // 🟢 Chi tiết đơn hàng
  // ======================================================
  async detail(orderId, userId) {
    const pool = await getPool();

    const header = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .input("UserId", sql.Int, userId)
      .query(`
        SELECT * FROM Orders
        WHERE Id = @OrderId AND UserId = @UserId
      `);

    if (!header.recordset.length) return null;

    const items = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .query(`
        SELECT * FROM OrderDetails WHERE OrderId = @OrderId
      `);

    return {
      ...header.recordset[0],
      items: items.recordset,
    };
  }

  // ======================================================
  // 🟢 Lịch sử thay đổi trạng thái
  // ======================================================
  async history(orderId) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .query(`
        SELECT * FROM OrderHistory
        WHERE OrderId = @OrderId
        ORDER BY ChangedAt DESC
      `);
    return result.recordset;
  }

  // ======================================================
  // 🟠 Hủy đơn hàng
  // ======================================================
  async cancel(orderId, userId) {
    const pool = await getPool();

    const oldStatusRes = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .query(`SELECT Status FROM Orders WHERE Id=@OrderId`);
    const oldStatus = oldStatusRes.recordset[0]?.Status;

    if (!oldStatus) throw new Error("Đơn hàng không tồn tại");

    // Cập nhật trạng thái
    await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .input("UserId", sql.Int, userId)
      .query(`
        UPDATE Orders SET Status=N'Cancelled'
        WHERE Id=@OrderId AND UserId=@UserId
      `);

    // Ghi lịch sử
    await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .input("OldStatus", sql.NVarChar(50), oldStatus)
      .input("NewStatus", sql.NVarChar(50), "Cancelled")
      .query(`
        INSERT INTO OrderHistory (OrderId, OldStatus, NewStatus)
        VALUES (@OrderId, @OldStatus, @NewStatus)
      `);

    return { orderId, oldStatus, newStatus: "Cancelled" };
  }
}

module.exports = new OrderService();
