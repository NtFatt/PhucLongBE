// routes/admin/admin.productRecipe.routes.js
const express = require('express');
const router = express.Router();

const { authenticateJWT, authorizeAdmin } = require('../../middleware/auth.middleware');
const productRecipeController = require('../../controllers/admin/admin.productRecipe.controller');

// Lấy danh sách công thức của 1 sản phẩm
router.get('/:id/recipe', authenticateJWT, authorizeAdmin, productRecipeController.getRecipe);

// Cập nhật hoặc ghi mới công thức cho 1 sản phẩm
router.put('/:id/recipe', authenticateJWT, authorizeAdmin, productRecipeController.updateRecipe);

// Xóa công thức của 1 sản phẩm
router.delete('/:id/recipe', authenticateJWT, authorizeAdmin, productRecipeController.deleteRecipe);

module.exports = router;
