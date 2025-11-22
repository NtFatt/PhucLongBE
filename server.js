// ======================================================
// 🌱 Load Environment Variables
// ======================================================
require("dotenv").config();

// ======================================================
// 🧩 Core Dependencies
// ======================================================
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

// ======================================================
// 🧰 Utilities & Middlewares
// ======================================================
const logger = require("./utils/logger");
const { authenticateJWT, authorizeAdmin } = require("./middleware/auth.middleware");
const { apiLimiter, loginLimiter } = require("./middleware/rateLimiter");
const { getPool } = require("./config/db");

// ✅ Cron job dọn refresh token hết hạn
require("./jobs/cleanupTokens");

// ======================================================
// 🚀 Express App Initialization
// ======================================================
const app = express();

// ======================================================
// ⚙️ Base Middlewares
// ======================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);

try {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
} catch (err) {
  console.warn("⚠️ Helmet init warning:", err.message);
}

app.use(compression());

// ======================================================
// 🌐 CORS Setup
// ======================================================
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = [
        process.env.FRONTEND_URL || "http://localhost:5173",
        process.env.ADMIN_URL || "http://localhost:5174",
        "http://localhost:5175",

        "http://localhost:3000",
        "http://localhost:3001",
        "https://phuclong.vn",
      ];
      if (!origin || allowed.includes(origin)) {
        cb(null, true);
      } else {
        console.warn("🚫 Blocked by CORS:", origin);
        cb(new Error("❌ Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ======================================================
// 🩺 Health Check Endpoint
// ======================================================
app.get("/", (req, res) => {
  res.send("🚀 PhucLong API is running perfectly!");
});

// ======================================================
// ⏱️ Global Rate Limiter
// ======================================================
app.use("/api", apiLimiter);

// ======================================================
// 🔓 PUBLIC ROUTES
// ======================================================
app.use("/api/auth", loginLimiter, require("./routes/auth.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/payment", require("./routes/payment.routes"));
app.use("/api/stores", require("./routes/store.routes"));
app.use("/api/vouchers", require("./routes/voucher.routes"));

// ======================================================
// 🔐 USER ROUTES
// ======================================================
app.use("/api/cart", authenticateJWT, require("./routes/cart.routes"));
app.use("/api/orders", authenticateJWT, require("./routes/order.routes"));
app.use("/api/loyalty", authenticateJWT, require("./routes/loyalty.routes"));
app.use("/api/history", authenticateJWT, require("./routes/orderHistory.routes"));
app.use("/api/reviews", authenticateJWT, require("./routes/review.routes"));
app.use("/api/toppings", require("./routes/topping.routes"));


// ======================================================
// 🧑‍💼 ADMIN ROUTES
// ======================================================
app.use("/api/admin/auth", require("./routes/admin/admin.auth.routes"));

// =====================
// POS ROUTES
// =====================
app.use("/api/pos", require("./routes/pos/pos.order.routes"));
// Employee Authentication
app.use("/api/employee/auth", require("./routes/admin/admin.employeeAuth.routes"));


// ✅ Giữ một bản duy nhất cho dashboard
app.use(
  "/api/admin/dashboard",
  authenticateJWT,
  authorizeAdmin,
  require("./routes/admin/admin.dashboard.routes")
);

app.use(
  "/api/admin/products",
  authenticateJWT,
  authorizeAdmin,
  require("./routes/admin/admin.product.routes")
);

app.use(
  "/api/admin/users",
  authenticateJWT,
  authorizeAdmin,
  require("./routes/admin/admin.user.routes")
);
app.use(
  "/api/admin/employees",
  authenticateJWT,
  authorizeAdmin,
  require("./routes/admin/admin.employee.routes")
);
app.use(
  "/api/admin/orders",
  authenticateJWT,
  authorizeAdmin,
  require("./routes/admin/admin.order.routes")
);
app.use(
  "/api/admin/categories",
  authenticateJWT,
  authorizeAdmin,
  require("./routes/admin/admin.category.routes")
);
app.use(
  "/api/admin/loyalty",
  authenticateJWT,
  authorizeAdmin,
  require("./routes/admin/admin.loyalty.routes")
);
app.use(
  "/api/admin/inventory",
  authenticateJWT,
  authorizeAdmin,
  require("./routes/admin/admin.inventory.routes")
);
app.use(
  "/api/admin/vouchers",
  authenticateJWT,
  authorizeAdmin,
  require("./routes/admin/admin.voucher.routes")
);
app.use(
  "/api/admin/reviews",
  authenticateJWT,
  authorizeAdmin,
  require("./routes/admin/admin.review.routes")
);
// ✅ Toppings management
app.use(
  "/api/admin/transactions",
  authenticateJWT,
  authorizeAdmin,
  require("./routes/admin/admin.transaction.routes")
);
app.use("/api/admin/toppings", authenticateJWT, authorizeAdmin, require("./routes/admin/admin.topping.routes"));
app.use(
  "/api/admin/topping-recipes",
  authenticateJWT,
  authorizeAdmin,
  require("./routes/admin/admin.toppingRecipe.routes")
);

// ✅ Order workflow management (Cashier & Barista)
app.use(
  "/api/admin/workflow",
  authenticateJWT,
  authorizeAdmin,
  require("./routes/admin/order.workflow.routes")
);

// ✅ Employee management
app.use(
  "/api/admin/employees",
  authenticateJWT,
  authorizeAdmin,
  require("./routes/admin/admin.employee.routes")
);

// customer management
app.use(
  "/api/admin/customers",
  authenticateJWT,
  authorizeAdmin,
  require("./routes/admin/admin.customer.routes")
);


// ======================================================
// 🧠 DEBUG ENDPOINT (Kiểm tra kết nối SQL)
// ======================================================
app.get("/__debug/db", async (req, res) => {
  try {
    const pool = await getPool();
    const rs = await pool.request().query(`
      SELECT
        @@SERVERNAME AS ServerName,
        CAST(SERVERPROPERTY('InstanceName') AS nvarchar(128)) AS InstanceName,
        DB_NAME() AS CurrentDB,
        CAST(CONNECTIONPROPERTY('local_net_address') AS nvarchar(48)) AS local_net_address,
        CAST(CONNECTIONPROPERTY('local_tcp_port') AS nvarchar(10)) AS local_tcp_port
    `);
    res.json(rs.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ======================================================
// ⚠️ GLOBAL ERROR HANDLER
// ======================================================
app.use((err, req, res, next) => {
  try {
    logger.error(err);
  } catch (_) {
    console.error("Logger failed:", err.message);
  }

  if (err?.message?.includes?.("Not allowed by CORS")) {
    return res.status(403).json({
      success: false,
      error: { code: "CORS_ERROR", message: err.message },
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.message || "Internal server error",
    },
  });
});

// ======================================================
// 🚀 START SERVER
// ======================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`✅ Server chạy ở http://localhost:${PORT}`);
  console.log("✅ SQL Server và API đều sẵn sàng hoạt động!");
});

// ======================================================
// 🧩 EXPORT APP
// ======================================================
module.exports = app;
