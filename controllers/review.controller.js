// ============================================================
// 🧩 ReviewController - Quản lý đánh giá sản phẩm
// ------------------------------------------------------------
// ✅ Hỗ trợ người dùng tạo / cập nhật review (upsert)
// ✅ Admin xem, chỉnh sửa, ẩn hiện hoặc xóa review
// ✅ Ghi log chi tiết, hỗ trợ debug dễ dàng
// ============================================================

const ReviewService = require("../services/review.service");

class ReviewController {
  // 🟢 Người dùng tạo hoặc cập nhật review
  static async createOrUpdate(req, res) {
    try {
      console.log("📩 Body nhận từ FE:", req.body);
      console.log("👤 Thông tin user từ token:", req.user);

      const {
        productId,
        rating,
        comment,
        serviceRating,
        deliveryRating,
        driverRating,
        tags,
        images,
      } = req.body;

      // 🧱 Kiểm tra đầu vào hợp lệ
      if (!productId || !rating) {
        console.warn("⚠️ Thiếu productId hoặc rating");
        return res
          .status(400)
          .json({ ok: false, error: "INVALID_INPUT", message: "Thiếu productId hoặc rating" });
      }

      if (!req.user || !req.user.userId) {
        console.error("❌ Lỗi: req.user bị undefined hoặc thiếu userId");
        return res
          .status(401)
          .json({ ok: false, error: "User not authenticated" });
      }

      // 🧩 Gọi service để insert/update review
      const result = await ReviewService.upsert(
        req.user.userId,
        productId,
        rating,
        comment,
        { serviceRating, deliveryRating, driverRating, tags, images }
      );

      if (!result.ok) {
        console.error("❌ ReviewService trả lỗi:", result.error);
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (err) {
      console.error("❌ Lỗi trong ReviewController.createOrUpdate:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // 🟢 Lấy danh sách review của 1 sản phẩm
  static async getProductReviews(req, res) {
    try {
      const productId = Number(req.params.productId);
      const data = await ReviewService.listByProduct(productId);
      res.json({ ok: true, data });
    } catch (err) {
      console.error("❌ Lỗi khi getProductReviews:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // 🟠 Người dùng xóa review của chính họ
  static async deleteOwnReview(req, res) {
    try {
      const id = Number(req.params.id);
      const output = await ReviewService.delete(id, req.user.userId, false);
      res.json(output);
    } catch (err) {
      console.error("❌ Lỗi khi deleteOwnReview:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // 🟣 Admin: Xem tất cả review
  static async adminList(req, res) {
    try {
      const data = await ReviewService.listAll();
      res.json({ ok: true, data });
    } catch (err) {
      console.error("❌ Lỗi adminList:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // 🟣 Admin: Cập nhật review (ẩn/hiện hoặc chỉnh sửa)
  static async adminUpdate(req, res) {
    try {
      const id = Number(req.params.id);
      const output = await ReviewService.updateByAdmin(id, req.body);
      res.json(output);
    } catch (err) {
      console.error("❌ Lỗi adminUpdate:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // 🟣 Admin: Xóa review
  static async adminDelete(req, res) {
    try {
      const id = Number(req.params.id);
      const output = await ReviewService.delete(id, null, true);
      res.json(output);
    } catch (err) {
      console.error("❌ Lỗi adminDelete:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }
}

module.exports = ReviewController;
