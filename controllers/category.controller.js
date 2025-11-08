// src/controllers/category.controller.js
const AdminCategoryService = require("../services/admin/admin.category.service");

class CategoryController {
  // 🔹 Lấy tất cả danh mục (public)
  static async getAll(req, res) {
    try {
      const data = await AdminCategoryService.getAll();
      res.json({ ok: true, data });
    } catch (err) {
      console.error("❌ [CategoryController.getAll] Lỗi:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // 🔹 Lấy 1 danh mục theo ID (public)
  static async getById(req, res) {
    try {
      const data = await AdminCategoryService.getById(req.params.id);
      if (!data)
        return res
          .status(404)
          .json({ ok: false, error: "Không tìm thấy danh mục" });

      res.json({ ok: true, data });
    } catch (err) {
      console.error("❌ [CategoryController.getById] Lỗi:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }
}

module.exports = CategoryController;
