// controllers/admin/admin.productRecipe.controller.js
const productRecipeService = require('../../services/admin.productRecipe.service');

// [GET] /api/admin/product-recipes/:id/recipe
async function getRecipe(req, res) {
  const { id } = req.params; // ProductId
  try {
    const recipes = await productRecipeService.getByProduct(id);
    res.status(200).json({
      success: true,
      data: recipes
    });
  } catch (error) {
    console.error('Error in getRecipe:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy công thức sản phẩm.',
      error: error.message
    });
  }
}

// [PUT] /api/admin/product-recipes/:id/recipe
async function updateRecipe(req, res) {
  const { id } = req.params; // ProductId
  const { recipeList } = req.body;

  if (!Array.isArray(recipeList) || recipeList.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Danh sách công thức không hợp lệ.'
    });
  }

  try {
    const result = await productRecipeService.setForProduct(id, recipeList);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in updateRecipe:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật công thức.',
      error: error.message
    });
  }
}

// [DELETE] /api/admin/product-recipes/:id/recipe
async function deleteRecipe(req, res) {
  const { id } = req.params; // ProductId
  try {
    const result = await productRecipeService.deleteByProduct(id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in deleteRecipe:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa công thức.',
      error: error.message
    });
  }
}

module.exports = {
  getRecipe,
  updateRecipe,
  deleteRecipe
};
