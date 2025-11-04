// ======================================================
// 📦 controllers/order.controller.js
// ------------------------------------------------------
// ✅ Quản lý toàn bộ API cho đơn hàng (Orders)
// ======================================================

const OrderService = require("../services/order.service");

const OrderController = {
  // ======================================================
  // 🟢 Tạo đơn hàng mới (POST /api/orders)
  // ======================================================
  async create(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized – cần đăng nhập để đặt hàng",
        });
      }
      const orderPayload = {
        storeId: req.body.storeId || 1,
        items: req.body.items,
        paymentMethod: req.body.paymentMethod,
        shippingAddress: req.body.shippingAddress,
        lat: req.body.lat,
        lng: req.body.lng,
        shippingFee: 0, // hoặc FE gửi lên nếu có
        pickupMethod: req.body.pickupMethod || "Delivery"
      };

      const orderData = req.body;
      console.log("🧾 [OrderController.create] userId =", userId);
      console.log("🧾 [OrderController.create] payload =", JSON.stringify(orderData));

      // ⚠️ FIX: truyền đúng thứ tự (userId, opts)
      const result = await OrderService.create(userId, orderData);

      return res.json({
        success: true,
        message: "Đặt hàng thành công",
        data: result,
      });
    } catch (err) {
      console.error("❌ OrderController.create:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Lỗi khi tạo đơn hàng",
      });
    }
  },

  // ======================================================
  // 🟢 Lấy danh sách đơn hàng của user (GET /api/orders)
  // ======================================================
  async list(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const orders = await OrderService.listByUser(userId);
      return res.json({
        success: true,
        data: orders,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message || "Không thể lấy danh sách đơn hàng",
      });
    }
  },

  // ======================================================
  // 🟢 Chi tiết đơn hàng (GET /api/orders/:id)
  // ======================================================
  async detail(req, res) {
    try {
      const userId = req.user?.userId;
      const orderId = parseInt(req.params.id, 10);

      const order = await OrderService.detail(orderId, userId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      return res.json({
        success: true,
        data: order,
      });
    } catch (err) {
      console.error("❌ OrderController.detail:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Lỗi khi lấy chi tiết đơn hàng",
      });
    }
  },

  // ======================================================
  // 🟢 Lịch sử thay đổi trạng thái đơn hàng (GET /api/orders/:id/history)
  // ======================================================
  async history(req, res) {
    try {
      const orderId = parseInt(req.params.id, 10);
      const data = await OrderService.history(orderId);
      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      console.error("❌ OrderController.history:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Không thể lấy lịch sử đơn hàng",
      });
    }
  },

  // ======================================================
  // 🟠 Hủy đơn hàng (PATCH /api/orders/:id/cancel)
  // ======================================================
  async cancel(req, res) {
    try {
      const userId = req.user?.userId;
      const orderId = parseInt(req.params.id, 10);

      const result = await OrderService.cancel(orderId, userId);
      return res.json({
        success: true,
        message: "Đã hủy đơn hàng thành công",
        data: result,
      });
    } catch (err) {
      console.error("❌ OrderController.cancel:", err);
      const code = /not found|không tồn tại/i.test(err.message) ? 404 : 400;
      res.status(code).json({
        success: false,
        message: err.message || "Không thể hủy đơn hàng",
      });
    }
  },
};

module.exports = OrderController;
