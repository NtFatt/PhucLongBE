const AdminCategoryService = require("../../services/admin/admin.category.service");

class AdminCategoryController {
  // 📦 Lấy tất cả danh mục
  static async getAll(req, res) {
    try {
      const data = await AdminCategoryService.getAll();
      res.json({ ok: true, data }); // FE chỉ cần đọc data
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh mục:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // 🔍 Lấy danh mục theo Name
  static async getByName(req, res) {
    try {
      const data = await AdminCategoryService.getByName(req.params.name);
      if (!data) return res.status(404).json({ ok: false, error: "Không tìm thấy danh mục" });
      res.json({ ok: true, data });
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh mục:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ➕ Tạo danh mục mới
  static async create(req, res) {
    try {
      const { Name } = req.body;
      if (!Name?.trim()) return res.status(400).json({ ok: false, error: "Thiếu tên danh mục" });

      const data = await AdminCategoryService.create(Name.trim());
      res.status(201).json({ ok: true, data });
    } catch (err) {
      console.error("❌ Lỗi khi thêm danh mục:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ✏️ Cập nhật tên danh mục
  static async update(req, res) {
    try {
      const oldName = req.params.name;
      const { Name: newName } = req.body;
      if (!newName?.trim()) return res.status(400).json({ ok: false, error: "Thiếu tên mới" });

      const data = await AdminCategoryService.update(oldName, newName.trim());
      res.json({ ok: true, data });
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật danh mục:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // 🗑️ Xóa danh mục theo Name
  static async delete(req, res) {
    try {
      const name = req.params.name;
      const data = await AdminCategoryService.delete(name);
      res.json({ ok: true, data });
    } catch (err) {
      console.error("❌ Lỗi khi xóa danh mục:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }
}

module.exports = AdminCategoryController;
