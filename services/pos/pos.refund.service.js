const { sql, getPool } = require("../../config/db");

class PosRefundService {

  static async refundOrder(orderId) {
    const pool = await getPool();

    // 1. Lấy order + items
    const rs = await pool.request()
      .input("OrderId", sql.Int, orderId)
      .query(`
        SELECT 
            o.StoreId,
            o.PaymentStatus,
            o.Status,
            i.ProductId,
            i.Quantity
        FROM Orders o
        JOIN OrderItems i ON o.Id = i.OrderId
        WHERE o.Id = @OrderId
      `);

    const rows = rs.recordset;
    if (rows.length === 0) throw new Error("Order không tồn tại");

    const order = rows[0];

    if (order.PaymentStatus !== "paid") {
      throw new Error("Chỉ refund được những order đã thanh toán.");
    }

    if (order.Status === "refunded") {
      throw new Error("Order đã refund trước đó.");
    }

    const storeId = order.StoreId;

    // ============================================
    // 2. Tính nguyên liệu CẦN HOÀN TRẢ (ngược với handleOrderPaid)
    // ============================================
    const ingredientsToReturn = {};

    for (const row of rows) {
      const recipeRs = await pool.request()
        .input("ProductId", sql.Int, row.ProductId)
        .query(`
          SELECT IngredientId, QuantityPerUnit
          FROM ProductRecipes
          WHERE ProductId = @ProductId
        `);

      for (const r of recipeRs.recordset) {
        const q = Number(r.QuantityPerUnit) * Number(row.Quantity);
        ingredientsToReturn[r.IngredientId] =
          (ingredientsToReturn[r.IngredientId] || 0) + q;
      }
    }

    // ============================================
    // 3. Cộng lại vào Inventory + ghi log REFUND
    // ============================================
    for (const [ingredientId, qty] of Object.entries(ingredientsToReturn)) {
      await pool.request()
        .input("StoreId", sql.Int, storeId)
        .input("IngredientId", sql.Int, Number(ingredientId))
        .input("ChangeQty", sql.Decimal(18, 3), qty) // cộng vào kho
        .input("OrderId", sql.Int, orderId)
        .query(`
          UPDATE Inventory
          SET QuantityOnHand = QuantityOnHand + @ChangeQty
          WHERE StoreId = @StoreId AND IngredientId = @IngredientId;

          INSERT INTO InventoryTransactions
            (StoreId, IngredientId, ChangeQty, Reason, OrderId)
          VALUES
            (@StoreId, @IngredientId, @ChangeQty, 'REFUND', @OrderId);
        `);
    }

    return { message: "Đã hoàn kho sau refund." };
  }
}

module.exports = PosRefundService;
