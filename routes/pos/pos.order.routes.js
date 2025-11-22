const express = require("express");
const router = express.Router();

const { authenticateJWT } = require("../../middleware/auth.middleware");
const { authorizeEmployee } = require("../../middleware/employee.middleware");
const PosOrderController = require("../../controllers/pos/pos.order.controller");

// ===============================
// CASHIER ROUTES
// ===============================

// GET /api/pos/orders
router.get(
  "/orders",
  authenticateJWT,
  authorizeEmployee(["cashier"]),
  PosOrderController.getCashierOrders
);

// Create order
router.post(
  "/orders/create",
  authenticateJWT,
  authorizeEmployee(["cashier"]),
  PosOrderController.createOrder
);

// Send order to barista
router.post(
  "/orders/send/:orderId",
  authenticateJWT,
  authorizeEmployee(["cashier"]),
  PosOrderController.sendToBarista
);

// Payment
router.post(
  "/orders/pay/:orderId",
  authenticateJWT,
  authorizeEmployee(["cashier"]),
  PosOrderController.payOrder
);

router.post(
  "/orders/:orderId/cancel",
  authenticateJWT,
  authorizeEmployee(["cashier"]),
  PosOrderController.cancelOrder
);

router.post(
  "/orders/:orderId/refund",
  authenticateJWT,
  authorizeEmployee(["cashier"]),
  PosOrderController.refundOrder
);

// BARISTA ROUTES
router.get(
  "/queue",
  authenticateJWT,
  authorizeEmployee(["barista"]),
  PosOrderController.getBaristaQueue
);

router.patch(
  "/status/:orderId",
  authenticateJWT,
  authorizeEmployee(["barista"]),
  PosOrderController.updateStatus
);

module.exports = router;
