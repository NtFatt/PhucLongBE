// src/controllers/admin/admin.category.controller.js
const AdminCategoryService = require("../../services/admin/admin.category.service");

class AdminCategoryController {
  // 📦 Lấy tất cả danh mục
  static async getAll(req, res) {
    try {
      const data = await AdminCategoryService.getAll();
      res.json({ ok: true, data }); // ✅ FE sẽ đọc được res.data.data
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh mục:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // 🔍 Lấy danh mục theo ID
  static async getById(req, res) {
    try {
      const data = await AdminCategoryService.getById(req.params.id);
      if (!data) return res.status(404).json({ ok: false, error: "Không tìm thấy danh mục" });
      res.json({ ok: true, data });
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh mục theo ID:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ➕ Tạo danh mục mới
  static async create(req, res) {
    try {
      const { Name } = req.body;
      if (!Name?.trim()) return res.status(400).json({ ok: false, error: "Thiếu tên danh mục" });

      const data = await AdminCategoryService.create(Name);
      res.status(201).json({ ok: true, data });
    } catch (err) {
      console.error("❌ Lỗi khi thêm danh mục:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ✏️ Cập nhật danh mục
  static async update(req, res) {
    try {
      const { Name } = req.body;
      if (!Name?.trim()) return res.status(400).json({ ok: false, error: "Thiếu tên danh mục" });

      const data = await AdminCategoryService.update(req.params.id, Name);
      res.json({ ok: true, data });
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật danh mục:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // 🗑️ Xóa danh mục
  static async delete(req, res) {
    try {
      const data = await AdminCategoryService.delete(req.params.id);
      res.json({ ok: true, data });
    } catch (err) {
      console.error("❌ Lỗi khi xóa danh mục:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }
}

module.exports = AdminCategoryController;
