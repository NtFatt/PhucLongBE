// models/productRecipe.model.js
class ProductRecipe {
  constructor({
    Id,
    ProductId,
    InventoryId,
    QuantityPerProduct,
    ProductName,
    InventoryName,
    Unit
  }) {
    this.Id = Id;
    this.ProductId = ProductId;
    this.InventoryId = InventoryId;
    this.QuantityPerProduct = QuantityPerProduct;
    // các thông tin mở rộng có thể join từ Products và Inventories
    this.ProductName = ProductName || null;
    this.InventoryName = InventoryName || null;
    this.Unit = Unit || null; // g/ml/kg...
  }
}

module.exports = ProductRecipe;
