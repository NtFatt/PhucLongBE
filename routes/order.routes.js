// routes/order.routes.js
const express = require("express");
const { authenticateJWT } = require("../middleware/auth.middleware");
const OrderController = require("../controllers/order.controller");

const router = express.Router();

/* ======================================================
   🚀 ROUTES: ORDER (Yêu cầu đăng nhập)
   ====================================================== */

// 🟢 Tạo đơn hàng mới (checkout)
router.post("/", authenticateJWT, OrderController.create);

// 🟢 Danh sách đơn hàng của user hiện tại
router.get("/", authenticateJWT, OrderController.list);

// 🟢 Chi tiết 1 đơn hàng
router.get("/:id", authenticateJWT, OrderController.detail);

// 🟢 Lịch sử thay đổi trạng thái đơn hàng
router.get("/:id/history", authenticateJWT, OrderController.history);

// 🟢 Hủy đơn hàng
router.patch("/:id/cancel", authenticateJWT, OrderController.cancel);

/* ======================================================
   ✅ EXPORT
   ====================================================== */
module.exports = router;
