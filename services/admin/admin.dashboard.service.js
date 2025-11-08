const { getPool } = require("../../config/db");

class AdminDashboardService {
  // --- Tổng quan (thống kê) ---
  static async getStats() {
    const pool = await getPool();

    const [users, ordersToday, revenueToday, revenueTotal] = await Promise.all([
      pool.request().query("SELECT COUNT(*) as totalUsers FROM Users"),
      pool.request().query(`
        SELECT COUNT(*) as ordersToday
        FROM Orders WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE)
      `),
      pool.request().query(`
        SELECT ISNULL(SUM(Total),0) as revenueToday
        FROM Orders WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE)
          AND PaymentStatus='paid'
      `),
      pool.request().query(`
        SELECT ISNULL(SUM(Total),0) as revenueTotal
        FROM Orders WHERE PaymentStatus='paid'
      `),
    ]);

    return {
      totalUsers: users.recordset[0].totalUsers,
      ordersToday: ordersToday.recordset[0].ordersToday,
      revenueToday: revenueToday.recordset[0].revenueToday,
      revenueTotal: revenueTotal.recordset[0].revenueTotal,
    };
  }

  // --- Doanh thu 7 tháng gần nhất ---
  static async getRevenueChart() {
    const pool = await getPool();
    const rs = await pool.request().query(`
      SELECT 
        FORMAT(CreatedAt, 'MM') AS Month,
        SUM(TotalAmount) AS Revenue
      FROM Orders
      WHERE CreatedAt >= DATEADD(MONTH, -6, GETDATE())
      GROUP BY FORMAT(CreatedAt, 'MM')
      ORDER BY Month
    `);
    return rs.recordset.map(r => ({
      name: "T" + r.Month,
      revenue: parseFloat(r.Revenue || 0),
    }));
  }

  // --- Top sản phẩm bán chạy ---
  static async getTopProducts() {
    const pool = await getPool();
    const rs = await pool.request().query(`
      SELECT TOP 5 p.Name, SUM(oi.Quantity) AS Sold
      FROM OrderItems oi
      JOIN Products p ON oi.ProductId = p.Id
      GROUP BY p.Name
      ORDER BY Sold DESC
    `);
    return rs.recordset;
  }
}

module.exports = AdminDashboardService;
