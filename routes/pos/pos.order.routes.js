const express = require("express");
const router = express.Router();

const { authenticateJWT } = require("../../middleware/auth.middleware");
const { authorizeEmployee } = require("../../middleware/employee.middleware");

const PosOrderController = require("../../controllers/pos/pos.order.controller");

// ===============================
// 🧾 CASHIER ROUTES
// ===============================

// Tạo order
router.post(
  "/create",
  authenticateJWT,
  authorizeEmployee(["cashier"]),
  PosOrderController.createOrder
);

// Gửi order sang barista queue
router.post(
  "/send/:orderId",
  authenticateJWT,
  authorizeEmployee(["cashier"]),
  PosOrderController.sendToBarista
);

// ===============================
// ☕ BARISTA ROUTES
// ===============================

// Lấy các order đang chờ pha chế
router.get(
  "/queue",
  authenticateJWT,
  authorizeEmployee(["barista"]),
  PosOrderController.getBaristaQueue
);

// Cập nhật trạng thái order
router.patch(
  "/status/:orderId",
  authenticateJWT,
  authorizeEmployee(["barista"]),
  PosOrderController.updateStatus
);

// Cashier thanh toán order
router.post(
  "/pay/:orderId",
  authenticateJWT,
  authorizeEmployee(["cashier"]),
  PosOrderController.payOrder
);

router.post("/:orderId/cancel", authenticateJWT, PosOrderController.cancelOrder);
router.post("/:orderId/refund", authenticateJWT, PosOrderController.refundOrder);

module.exports = router;
