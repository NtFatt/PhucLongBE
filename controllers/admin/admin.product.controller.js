// src/controllers/admin/admin.product.controller.js
const AdminProductService = require("../../services/admin/admin.product.service");

class AdminProductController {
  static async getAll(req, res) {
    try {
      const products = await AdminProductService.getAll();
      res.json(products);
    } catch (err) {
      console.error("❌ [AdminProductController.getAll] Lỗi:", err);
      res.status(500).json({ error: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const product = await AdminProductService.getById(req.params.id);
      res.json(product);
    } catch (err) {
      console.error("❌ [AdminProductController.getById] Lỗi:", err);
      res.status(404).json({ error: err.message });
    }
  }

  static async create(req, res) {
    try {
      console.log("📩 [AdminProductController.create] Body nhận từ FE:", req.body);

      const data = req.body;

      // ✅ Chuẩn hóa field để tránh undefined
      data.Name = data.Name || data.name;
      data.Price = data.Price || data.price;
      data.Description = data.Description || data.description;
      data.Stock = data.Stock || data.stock || 0;
      data.CategoryName = data.CategoryName || data.categoryName || "Chưa phân loại";
      data.ImageUrl = data.ImageUrl || data.imageUrl || "";

      // ✅ Log lại sau khi normalize
      console.log("🧩 Sau khi chuẩn hóa:", data);

      // ✅ Kiểm tra bắt buộc
      if (!data.Name || !data.Price) {
        console.warn("⚠️ Thiếu Name hoặc Price trong body:", data);
        return res.status(400).json({ error: "Thiếu tên hoặc giá sản phẩm" });
      }

      const result = await AdminProductService.create(data);
      console.log("✅ [AdminProductController.create] Tạo thành công:", result);

      res.status(201).json(result);
    } catch (err) {
      console.error("🔥 [AdminProductController.create] Lỗi:", err);
      res.status(400).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      console.log("📩 [AdminProductController.update] Body nhận từ FE:", req.body);

      const data = req.body;

      data.Name = data.Name || data.name;
      data.Price = data.Price || data.price;
      data.Description = data.Description || data.description;
      data.Stock = data.Stock || data.stock || 0;
      data.CategoryName = data.CategoryName || data.categoryName || "Chưa phân loại";
      data.ImageUrl = data.ImageUrl || data.imageUrl || "";

      console.log("🧩 Sau khi chuẩn hóa (update):", data);

      const result = await AdminProductService.update(req.params.id, data);
      console.log("✅ [AdminProductController.update] Cập nhật thành công:", result);

      res.json(result);
    } catch (err) {
      console.error("🔥 [AdminProductController.update] Lỗi:", err);
      res.status(400).json({ error: err.message });
    }
  }

  static async delete(req, res) {
    try {
      console.log("🗑️ [AdminProductController.delete] Xóa ID:", req.params.id);
      const result = await AdminProductService.delete(req.params.id);
      res.json(result);
    } catch (err) {
      console.error("🔥 [AdminProductController.delete] Lỗi:", err);
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = AdminProductController;
