// routes/product.routes.js
const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");

// ==========================
// 📦 ROUTES SẢN PHẨM
// ==========================

// 🔹 Lấy tất cả sản phẩm (FE người dùng)
router.get("/", productController.getAll);

// 🔹 Lấy chi tiết 1 sản phẩm theo ID
router.get("/:id", productController.getById);

// 🔹 (Admin) Thêm sản phẩm mới
router.post("/", productController.create);

// 🔹 (Admin) Cập nhật sản phẩm
router.put("/:id", productController.update);

// 🔹 (Admin) Xóa sản phẩm
router.delete("/:id", productController.delete);

module.exports = router;
