// controllers/product.controller.js
const ProductService = require("../services/product.service");

/**
 * ===========================================
 * 📦 Controller xử lý logic cho Products
 * ===========================================
 */

// 🔹 Lấy danh sách tất cả sản phẩm (có thể lọc, sắp xếp)
exports.getAll = async (req, res) => {
    try {
        const { categoryId, sort, bestseller } = req.query;

        const products = await ProductService.getAll({
            categoryId,
            sort,
            bestseller: bestseller === "true",
        });

        return res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        console.error("❌ [ProductController.getAll] Lỗi:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi khi tải danh sách sản phẩm",
        });
    }
};

// 🔹 Lấy chi tiết 1 sản phẩm theo Id
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Thiếu hoặc sai định dạng ID sản phẩm",
            });
        }

        const product = await ProductService.getById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm",
            });
        }

        return res.status(200).json({
            success: true,
            data: product,
        });
    } catch (error) {
        console.error("❌ [ProductController.getById] Lỗi:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi khi tải chi tiết sản phẩm",
        });
    }
};

// 🔹 Thêm sản phẩm mới (admin dùng)
exports.create = async (req, res) => {
    try {
        const data = req.body;
        if (!data.Name || !data.Price) {
            return res.status(400).json({
                success: false,
                message: "Thiếu tên hoặc giá sản phẩm",
            });
        }

        const result = await ProductService.create(data);
        return res.status(201).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        console.error("❌ [ProductController.create] Lỗi:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi khi thêm sản phẩm",
        });
    }
};

// 🔹 Cập nhật sản phẩm theo Id
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu ID sản phẩm để cập nhật",
            });
        }

        await ProductService.update(id, data);
        return res.status(200).json({
            success: true,
            message: "✅ Đã cập nhật sản phẩm",
        });
    } catch (error) {
        console.error("❌ [ProductController.update] Lỗi:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật sản phẩm",
        });
    }
};

// 🔹 Xóa sản phẩm theo Id
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu ID sản phẩm để xóa",
            });
        }

        await ProductService.delete(id);
        return res.status(200).json({
            success: true,
            message: "✅ Đã xóa sản phẩm",
        });
    } catch (error) {
        console.error("❌ [ProductController.delete] Lỗi:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi khi xóa sản phẩm",
        });
    }
};
