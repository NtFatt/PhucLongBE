const express = require("express");
const router = express.Router(); // ❗ BẠT BUỘC PHẢI CÓ
const { getPool } = require("../../config/db");
const { authenticateJWT, authorizeAdmin } = require("../../middleware/auth.middleware");
const AdminOrderController = require("../../controllers/admin/admin.order.controller");
const AdminOrderService = require("../../services/admin/admin.order.service");

// Middleware xác thực và phân quyền cho tất cả các route trong file này
router.use(authenticateJWT);
router.use(authorizeAdmin);
router.get("/", async (req, res) => {
  try {
    const pool = await getPool();

    const query = `
      SELECT TOP 100
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
    `;

    const result = await pool.request().query(query);
    res.json({ ok: true, data: result.recordset });
  } catch (err) {
    console.error("❌ Lỗi truy vấn đơn hàng:", err);
    res.status(500).json({ ok: false, error: "Lỗi máy chủ" });
  }
});
module.exports = router;