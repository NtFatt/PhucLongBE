// services/orderHistory.service.js
const { sql, getPool } = require("../config/db");

class OrderHistoryService {
  // ==========================================================
  // 🟢 Ghi lịch sử thay đổi trạng thái đơn hàng
  // ----------------------------------------------------------
  // Có thể gọi trực tiếp từ OrderService khi trạng thái đổi
  // tx: transaction (optional)
  // ==========================================================
  static async logChange(orderId, oldStatus, newStatus, tx = null) {
    const pool = tx ? tx : await getPool();
    const request = tx ? new sql.Request(tx) : pool.request();

    await request
      .input("OrderId", sql.Int, orderId)
      .input("OldStatus", sql.NVarChar(50), oldStatus)
      .input("NewStatus", sql.NVarChar(50), newStatus)
      .query(`
        INSERT INTO OrderHistory (OrderId, OldStatus, NewStatus, ChangedAt)
        VALUES (@OrderId, @OldStatus, @NewStatus, SYSUTCDATETIME())
      `);
  }

  // ==========================================================
  // 🟢 Danh sách lịch sử thay đổi trạng thái 1 đơn hàng
  // ==========================================================
  static async getByOrder(orderId) {
    const pool = await getPool();
    const result = await pool.request()
      .input("OrderId", sql.Int, orderId)
      .query(`
        SELECT 
          Id,
          OrderId,
          OldStatus,
          NewStatus,
          ChangedAt
        FROM OrderHistory
        WHERE OrderId=@OrderId
        ORDER BY ChangedAt DESC
      `);
    return result.recordset;
  }

  // ==========================================================
  // 🟢 Danh sách đơn hàng (của user)
  // ==========================================================
  static async getByUser(userId) {
    const pool = await getPool();
    const result = await pool.request()
      .input("UserId", sql.Int, userId)
      .query(`
        SELECT 
          o.Id AS OrderId,
          o.CreatedAt,
          o.Status,
          o.Total,
          o.PaymentStatus,
          o.PaymentMethod,
          s.Name AS StoreName,
          COUNT(oi.Id) AS ItemCount
        FROM Orders o
        LEFT JOIN Stores s ON o.StoreId = s.Id
        LEFT JOIN OrderItems oi ON o.Id = oi.OrderId
        WHERE o.UserId = @UserId
        GROUP BY 
          o.Id, o.CreatedAt, o.Status, o.Total, 
          o.PaymentStatus, o.PaymentMethod, s.Name
        ORDER BY o.CreatedAt DESC
      `);
    return result.recordset;
  }

  // ==========================================================
  // 🟢 Chi tiết 1 đơn hàng (bao gồm items & giao dịch)
  // ==========================================================
  static async getDetail(orderId, userId) {
    const pool = await getPool();

    // 1️⃣ Thông tin đơn hàng
    const orderRes = await pool.request()
      .input("Id", sql.Int, orderId)
      .input("UserId", sql.Int, userId)
      .query(`
        SELECT 
          o.Id AS OrderId,
          o.UserId,
          o.Status,
          o.Total,
          o.PaymentStatus,
          o.PaymentMethod,
          o.CreatedAt,
          o.UpdatedAt,
          s.Name AS StoreName,
          s.Address AS StoreAddress
        FROM Orders o
        LEFT JOIN Stores s ON o.StoreId = s.Id
        WHERE o.Id=@Id AND o.UserId=@UserId
      `);

    if (!orderRes.recordset.length)
      return { ok: false, error: "ORDER_NOT_FOUND" };

    // 2️⃣ Danh sách sản phẩm trong đơn
    const itemsRes = await pool.request()
      .input("OrderId", sql.Int, orderId)
      .query(`
        SELECT 
          oi.ProductId,
          p.Name AS ProductName,
          oi.Quantity,
          oi.Price,
          oi.Sugar,
          oi.Ice
        FROM OrderItems oi
        JOIN Products p ON oi.ProductId = p.Id
        WHERE oi.OrderId=@OrderId
      `);

    // 3️⃣ Giao dịch thanh toán (nếu có)
    const txnRes = await pool.request()
      .input("OrderId", sql.Int, orderId)
      .query(`
        SELECT 
          t.Provider, t.TxnRef, t.Amount, t.Currency, 
          t.Status, t.CreatedAt
        FROM Transactions t
        WHERE t.OrderId=@OrderId
        ORDER BY t.CreatedAt DESC
      `);

    // 4️⃣ Lịch sử thay đổi trạng thái
    const historyRes = await pool.request()
      .input("OrderId", sql.Int, orderId)
      .query(`
        SELECT OldStatus, NewStatus, ChangedAt
        FROM OrderHistory
        WHERE OrderId=@OrderId
        ORDER BY ChangedAt DESC
      `);

    return {
      ok: true,
      data: {
        order: orderRes.recordset[0],
        items: itemsRes.recordset,
        transactions: txnRes.recordset,
        history: historyRes.recordset,
      },
    };
  }

  // ==========================================================
  // 🟢 (Admin) Toàn bộ đơn hàng hệ thống
  // ==========================================================
  static async getAll() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        o.Id AS OrderId,
        u.Name AS UserName,
        u.Email,
        o.Status,
        o.Total,
        o.PaymentStatus,
        o.PaymentMethod,
        o.CreatedAt
      FROM Orders o
      JOIN Users u ON o.UserId = u.Id
      ORDER BY o.CreatedAt DESC
    `);
    return result.recordset;
  }
}

module.exports = OrderHistoryService;
