const CategoryModel = require("../../models/category.model");

class AdminCategoryService {
  // Lấy tất cả danh mục
  static async getAll() {
    return await CategoryModel.getAll();
  }

  // Lấy danh mục theo Name
  static async getByName(name) {
    const cat = await CategoryModel.getByName(name);
    if (!cat) throw new Error("Không tìm thấy danh mục");
    return cat;
  }

  // Thêm danh mục
  static async create(name) {
    const existing = await CategoryModel.getAll();
    if (existing.some(c => c.Name?.toLowerCase() === name.toLowerCase())) {
      throw new Error("Danh mục đã tồn tại");
    }
    return await CategoryModel.create(name);
  }

  // Cập nhật danh mục (đổi tên)
  static async update(oldName, newName) {
    const exist = await CategoryModel.getByName(oldName);
    if (!exist) throw new Error("Không tìm thấy danh mục để cập nhật");
    return await CategoryModel.update(oldName, newName);
  }

  // Xóa danh mục theo Name
  static async delete(name) {
    const exist = await CategoryModel.getByName(name);
    if (!exist) throw new Error("Không tìm thấy danh mục để xóa");
    await CategoryModel.delete(name);
    return { message: `Đã xóa danh mục '${name}'` };
  }
}

module.exports = AdminCategoryService;
