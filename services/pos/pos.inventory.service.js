const { sql, getPool } = require("../../config/db");

class PosInventoryService {
  
  // ============================================
  // 👉 TRỪ KHO SAU KHI THANH TOÁN
  // ============================================
  static async handleOrderPaid(orderId) {
    const pool = await getPool();

    // --------------------------------------------
    // 1) Lấy Order + OrderItems + StoreId
    // --------------------------------------------
    const orderRs = await pool.request()
      .input("OrderId", sql.Int, orderId)
      .query(`
        SELECT 
            o.StoreId,
            i.ProductId,
            i.Quantity
        FROM Orders o
        JOIN OrderItems i ON o.Id = i.OrderId
        WHERE o.Id = @OrderId
      `);

    if (orderRs.recordset.length === 0) {
      throw new Error("Không tìm thấy Order hoặc Order không có sản phẩm.");
    }

    const rows = orderRs.recordset;
    const storeId = rows[0].StoreId;

    if (!storeId) {
      throw new Error("Order không có StoreId — không thể trừ kho.");
    }

    // --------------------------------------------
    // 2) Gom công thức các sản phẩm
    // --------------------------------------------
    const ingredientsNeeded = {};  
    // dạng: { IngredientId: Tổng số cần dùng }

    for (const item of rows) {
      const recipeRs = await pool.request()
        .input("ProductId", sql.Int, item.ProductId)
        .query(`
          SELECT IngredientId, QuantityPerUnit
          FROM ProductRecipes
          WHERE ProductId = @ProductId
        `);

      for (const cp of recipeRs.recordset) {
        const usedQty = Number(cp.QuantityPerUnit) * Number(item.Quantity);

        ingredientsNeeded[cp.IngredientId] =
          (ingredientsNeeded[cp.IngredientId] || 0) + usedQty;
      }
    }

    // --------------------------------------------
    // 3) Kiểm tra kho đủ hay không
    // --------------------------------------------
    for (const [ingredientId, needQty] of Object.entries(ingredientsNeeded)) {
      const invRs = await pool.request()
        .input("StoreId", sql.Int, storeId)
        .input("IngredientId", sql.Int, ingredientId)
        .query(`
          SELECT QuantityOnHand
          FROM Inventory
          WHERE StoreId = @StoreId AND IngredientId = @IngredientId
        `);

      const available =
        invRs.recordset[0]?.QuantityOnHand != null
          ? Number(invRs.recordset[0].QuantityOnHand)
          : 0;

      if (available < needQty) {
        throw new Error(
          `Chi nhánh ${storeId} không đủ nguyên liệu (IngredientId=${ingredientId}). 
           Cần ${needQty}, còn ${available}.`
        );
      }
    }

    // --------------------------------------------
    // 4) TRỪ KHO + LOG TRANSACTION
    // --------------------------------------------
    for (const [ingredientId, needQty] of Object.entries(ingredientsNeeded)) {
      await pool.request()
        .input("StoreId", sql.Int, storeId)
        .input("IngredientId", sql.Int, Number(ingredientId))
        .input("ChangeQty", sql.Decimal(18, 3), -needQty)
        .input("OrderId", sql.Int, orderId)
        .query(`
          UPDATE Inventory
          SET QuantityOnHand = QuantityOnHand + @ChangeQty
          WHERE StoreId = @StoreId AND IngredientId = @IngredientId;

          INSERT INTO InventoryTransactions
            (StoreId, IngredientId, ChangeQty, Reason, OrderId)
          VALUES
            (@StoreId, @IngredientId, @ChangeQty, 'SALE', @OrderId);
        `);
    }

    return {
      message: "Đã trừ kho theo công thức sản phẩm."
    };
  }
}

module.exports = PosInventoryService;
