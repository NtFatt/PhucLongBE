const AdminDashboardService = require("../../services/admin/admin.dashboard.service");

class AdminDashboardController {
  static async getStats(req, res) {
    try {
      const stats = await AdminDashboardService.getStats();
      const chartData = await AdminDashboardService.getRevenueChart();
      const topProducts = await AdminDashboardService.getTopProducts();

      res.json({
        ok: true,
        stats,
        chartData,
        topProducts,
      });
    } catch (err) {
      console.error("❌ Lỗi Controller:", err);
      res.status(500).json({
        ok: false,
        error: err.message || "Lỗi khi lấy dữ liệu dashboard",
      });
    }
  }
}

module.exports = AdminDashboardController;
