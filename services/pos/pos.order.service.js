const { sql, getPool } = require("../../config/db");
const PosInventoryService = require("./pos.inventory.service");

class PosOrderService {

// =======================================
// 1. CASHIER — LẤY LIST ORDER (pending, waiting)
// =======================================
static async getCashierOrders(user) {
    const pool = await getPool();

    // 1. Lấy danh sách đơn
    const ordersRs = await pool.request().query(`
        SELECT 
            o.Id,
            o.UserId,
            o.Total,
            o.Status,
            o.PaymentStatus,
            o.CreatedAt,
            u.Name AS CustomerName
        FROM Orders o
        LEFT JOIN Users u ON o.UserId = u.Id
        WHERE o.Status IN ('pending', 'waiting')
        ORDER BY o.CreatedAt DESC
    `);

    const orders = ordersRs.recordset;

    if (orders.length === 0) return [];

    // 2. Lấy danh sách items của tất cả order
    const itemsRs = await pool.request().query(`
        SELECT 
            oi.OrderId,
            oi.ProductId,
            oi.Quantity,
            oi.Price,
            p.Name AS ProductName,
            p.ImageUrl
        FROM OrderItems oi
        JOIN Products p ON oi.ProductId = p.Id
        WHERE oi.OrderId IN (${orders.map(o => o.Id).join(",")})
    `);

    const items = itemsRs.recordset;
console.log(">>> ORDER ITEMS:", items);

    // 3. Gắn items vào đúng order
    const final = orders.map(o => ({
        ...o,
        Items: items.filter(i => i.OrderId === o.Id)
    }));

    return final;
}

    // =======================================
    // 2. CASHIER — Tạo order
    // =======================================
    static async createOrder(payload, user) {
        const { items, voucherCode } = payload;

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("Danh sách sản phẩm trống");
        }

        const pool = await getPool();

        // Tính tổng tiền
        let subTotal = 0;
        for (const item of items) {
            if (!item.productId || !item.quantity || !item.price) {
                throw new Error("Thiếu thông tin sản phẩm");
            }
            subTotal += Number(item.price) * Number(item.quantity);
        }

        const totalAmount = subTotal;

        // Lấy chi nhánh của cashier
        const empRs = await pool.request()
            .input("UserId", sql.Int, user.id)
            .query(`
                SELECT TOP 1 StoreId
                FROM Employees
                WHERE UserId = @UserId
            `);

        const storeId = empRs.recordset[0]?.StoreId || null;

        // Insert Order
        const orderResult = await pool.request()
            .input("UserId", sql.Int, user.id)
            .input("StoreId", sql.Int, null)
            .input("VoucherCode", sql.NVarChar, voucherCode || null)
            .input("Status", sql.NVarChar, "pending")
            .input("PaymentStatus", sql.NVarChar, "unpaid")
            .input("Total", sql.Decimal(18, 2), totalAmount)
            .query(`
                INSERT INTO Orders (UserId, StoreId, VoucherCode, Status, PaymentStatus, Total, CreatedAt)
                OUTPUT INSERTED.Id
                VALUES (@UserId, @StoreId, @VoucherCode, @Status, @PaymentStatus, @Total, GETDATE())
            `);

        const orderId = orderResult.recordset[0].Id;

        // Insert Items
        for (const item of items) {
            await pool.request()
                .input("OrderId", sql.Int, orderId)
                .input("ProductId", sql.Int, item.productId)
                .input("Quantity", sql.Int, item.quantity)
                .input("Price", sql.Decimal(18, 2), item.price)
                .query(`
                    INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price)
                    VALUES (@OrderId, @ProductId, @Quantity, @Price)
                `);
        }

        return {
            message: "Tạo order thành công",
            orderId,
            totalAmount
        };
    }

    // =======================================
    // 3. CASHIER — Gửi order sang Barista
    // =======================================
    static async sendToBarista(orderId) {
        const pool = await getPool();

        await pool.request()
            .input("OrderId", sql.Int, orderId)
            .query(`
                UPDATE Orders 
                SET Status = 'waiting'
                WHERE Id = @OrderId
            `);

        return { message: "Đã gửi order sang Barista", orderId };
    }

    // =======================================
    // 4. BARISTA — Xem queue
    // =======================================
    static async getBaristaQueue() {
        const pool = await getPool();

        const rs = await pool.request().query(`
            SELECT 
                Id, UserId, StoreId, Total, Status, PaymentStatus, CreatedAt
            FROM Orders
            WHERE Status IN ('waiting', 'preparing')
            ORDER BY CreatedAt ASC
        `);

        return rs.recordset;
    }

    // =======================================
    // 5. BARISTA — Update status
    // =======================================
    static async updateStatus(orderId, status) {
        const valid = ["preparing", "done"];
        if (!valid.includes(status)) throw new Error("Trạng thái không hợp lệ");

        const pool = await getPool();

        await pool.request()
            .input("OrderId", sql.Int, orderId)
            .input("Status", sql.NVarChar, status)
            .query(`
                UPDATE Orders
                SET Status = @Status
                WHERE Id = @OrderId
            `);

        return { message: "Cập nhật trạng thái thành công", orderId, status };
    }

    // =======================================
    // 6. CASHIER — Thanh toán
    // =======================================
    static async payOrder(orderId, paymentMethod, amountPaid, user) {
        const pool = await getPool();

        const rs = await pool.request()
            .input("OrderId", sql.Int, orderId)
            .query(`
                SELECT Id, Total, PaymentStatus, Status
                FROM Orders
                WHERE Id = @OrderId
            `);

        const order = rs.recordset[0];
        if (!order) throw new Error("Order không tồn tại");

        if (order.PaymentStatus === "paid") {
            throw new Error("Order đã thanh toán");
        }

        const total = Number(order.Total);
        const paid = Number(amountPaid);

        if (paid < total) throw new Error("Khách đưa thiếu tiền");

        const change = paid - total;

        await pool.request()
            .input("OrderId", sql.Int, orderId)
            .input("PaymentMethod", sql.NVarChar, paymentMethod || "cash")
            .input("AmountPaid", sql.Decimal(18, 2), paid)
            .input("ChangeAmount", sql.Decimal(18, 2), change)
            .input("PaymentStatus", sql.NVarChar, "paid")
            .query(`
                UPDATE Orders
                SET PaymentMethod = @PaymentMethod,
                    AmountPaid = @AmountPaid,
                    ChangeAmount = @ChangeAmount,
                    PaymentStatus = 'paid'
                WHERE Id = @OrderId
            `);

        await PosInventoryService.handleOrderPaid(orderId);

        return {
            message: "Thanh toán thành công",
            orderId,
            totalAmount: total,
            amountPaid: paid,
            changeAmount: change
        };
    }
}

module.exports = PosOrderService;
