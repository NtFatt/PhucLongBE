// services/admin.productRecipe.service.js
const sql = require('mssql');
const dbConfig = require('../config/db');
const ProductRecipe = require('../models/productRecipe.model');

// Lấy danh sách nguyên liệu theo ProductId
async function getByProduct(productId) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('ProductId', sql.Int, productId)
      .query(`
        SELECT pr.Id, pr.ProductId, pr.InventoryId, pr.QuantityPerProduct,
               i.Name AS InventoryName, i.Unit
        FROM ProductRecipes pr
        INNER JOIN Inventories i ON pr.InventoryId = i.Id
        WHERE pr.ProductId = @ProductId
      `);

    return result.recordset.map(row => new ProductRecipe(row));
  } catch (error) {
    console.error('Error in getByProduct:', error);
    throw error;
  }
}

// Ghi mới toàn bộ công thức cho 1 sản phẩm (ghi đè)
async function setForProduct(productId, recipeList) {
  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const request = new sql.Request(transaction);
    // Xóa công thức cũ
    await request
      .input('ProductId', sql.Int, productId)
      .query('DELETE FROM ProductRecipes WHERE ProductId = @ProductId');

    // Thêm mới công thức
    for (const item of recipeList) {
      const req = new sql.Request(transaction);
      await req
        .input('ProductId', sql.Int, productId)
        .input('InventoryId', sql.Int, item.InventoryId)
        .input('QuantityPerProduct', sql.Decimal(10, 2), item.QuantityPerProduct)
        .query(`
          INSERT INTO ProductRecipes (ProductId, InventoryId, QuantityPerProduct)
          VALUES (@ProductId, @InventoryId, @QuantityPerProduct)
        `);
    }

    await transaction.commit();
    return { message: 'Cập nhật công thức thành công.' };
  } catch (error) {
    await transaction.rollback();
    console.error('Error in setForProduct:', error);
    throw error;
  }
}

// Xóa công thức theo ProductId
async function deleteByProduct(productId) {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('ProductId', sql.Int, productId)
      .query('DELETE FROM ProductRecipes WHERE ProductId = @ProductId');
    return { message: 'Đã xóa công thức.' };
  } catch (error) {
    console.error('Error in deleteByProduct:', error);
    throw error;
  }
}

module.exports = {
  getByProduct,
  setForProduct,
  deleteByProduct
};
