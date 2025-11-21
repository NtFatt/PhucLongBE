const { sql, getPool } = require("../../config/db");
const PosInventoryService = require("./pos.inventory.service"); // 👈 QUAN TRỌNG: thêm dòng này

class PosOrderService {
    //===========================
    // 1. CASHIER: tạo order
    //===========================
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
                throw new Error("Thiếu thông tin sản phẩm trong items");
            }
            subTotal += Number(item.price) * Number(item.quantity);
        }

        const discountAmount = 0;
        const totalAmount = subTotal - discountAmount;

        // Lấy chi nhánh của nhân viên
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
            .input("StoreId", sql.Int, storeId)
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
            totalAmount,
        };
    }

    //===========================
    // 2. CASHIER gửi order sang barista
    //===========================
    static async sendToBarista(orderId) {
        const pool = await getPool();

        await pool.request()
            .input("OrderId", sql.Int, orderId)
            .query(`
                UPDATE Orders SET Status = 'waiting'
                WHERE Id = @OrderId
            `);

        return { message: "Đã gửi order sang Barista", orderId };
    }

    //===========================
    // 3. BARISTA xem hàng đợi
    //===========================
    static async getBaristaQueue() {
        const pool = await getPool();

        const rs = await pool.request().query(`
            SELECT *
            FROM Orders
            WHERE Status IN ('waiting', 'preparing')
            ORDER BY CreatedAt ASC
        `);

        return rs.recordset;
    }

    //===========================
    // 4. BARISTA cập nhật trạng thái
    //===========================
    static async updateStatus(orderId, status) {
        const valid = ["preparing", "done"];
        if (!valid.includes(status)) {
            throw new Error("Trạng thái không hợp lệ");
        }

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

    //===========================
    // 5. CASHIER thanh toán
    //===========================
    static async payOrder(orderId, paymentMethod, amountPaid, user) {
        const pool = await getPool();

        // Lấy thông tin order
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
            throw new Error("Order đã được thanh toán");
        }

        if (["canceled", "refunded"].includes(order.Status)) {
            throw new Error("Order đã bị hủy/hoàn tiền, không thể thanh toán");
        }

        const total = Number(order.Total);
        const paid = Number(amountPaid);
        if (isNaN(paid)) {
            throw new Error("Số tiền thanh toán không hợp lệ");
        }
        if (paid < total) {
            throw new Error("Số tiền khách đưa nhỏ hơn tổng tiền");
        }

        const change = paid - total;

        // Update payment info
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
                    PaymentStatus = @PaymentStatus
                WHERE Id = @OrderId
            `);

        // 👇 TRỪ KHO SAU KHI THANH TOÁN
        await PosInventoryService.handleOrderPaid(orderId);

        return {
            message: "Thanh toán thành công",
            orderId,
            totalAmount: total,
            amountPaid: paid,
            changeAmount: change,
            paymentMethod,
        };
    }

    static async cancelOrder(orderId, user) {
        const pool = await getPool();

        const rs = await pool.request()
            .input("OrderId", sql.Int, orderId)
            .query(`
            SELECT Id, PaymentStatus, Status
            FROM Orders
            WHERE Id = @OrderId
        `);

        const order = rs.recordset[0];
        if (!order) throw new Error("Order không tồn tại");

        if (order.PaymentStatus === "paid") {
            throw new Error("Order đã thanh toán — không thể cancel.");
        }

        if (!["pending", "waiting"].includes(order.Status)) {
            throw new Error("Order đã vào barista hoặc hoàn tất — không thể cancel.");
        }

        await pool.request()
            .input("OrderId", sql.Int, orderId)
            .query(`
            UPDATE Orders
            SET Status = 'canceled'
            WHERE Id = @OrderId
        `);

        return { message: "Đã hủy đơn hàng", orderId };
    }

    static async refundOrder(orderId, user) {
        const pool = await getPool();

        const rs = await pool.request()
            .input("OrderId", sql.Int, orderId)
            .query(`
            SELECT Id, PaymentStatus, Status
            FROM Orders
            WHERE Id = @OrderId
        `);

        const order = rs.recordset[0];
        if (!order) throw new Error("Order không tồn tại");

        if (order.PaymentStatus !== "paid") {
            throw new Error("Chỉ refund các order đã thanh toán.");
        }

        if (order.Status === "refunded") {
            throw new Error("Order đã refund trước đó.");
        }

        // 1) HOÀN KHO TRƯỚC
        const PosRefundService = require("./pos.refund.service");
        await PosRefundService.refundOrder(orderId);

        // 2) SAU ĐÓ MỚI CẬP NHẬT TRẠNG THÁI ĐƠN
        await pool.request()
            .input("OrderId", sql.Int, orderId)
            .query(`
            UPDATE Orders
            SET Status = 'refunded',
                PaymentStatus = 'refunded'
            WHERE Id = @OrderId
        `);

        return { message: "Refund thành công", orderId };
    }


}

module.exports = PosOrderService;
