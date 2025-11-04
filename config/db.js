// =============================================================
// 📦 SQL Server Connection (MSSQL + dotenv)
// -------------------------------------------------------------
// ✅ Hỗ trợ cả instance (SQLEXPRESS) lẫn cổng (1433)
// ✅ Tự động reconnect khi lỗi
// ✅ Hoàn toàn tương thích Node.js 22 + mssql@11
// =============================================================

require("dotenv").config();
const sql = require("mssql");

// =============================================================
// 🧭 Load & Chuẩn hóa ENV
// =============================================================
let DB_SERVER = process.env.DB_SERVER?.trim() || "localhost";
const DB_NAME = process.env.DB_NAME?.trim() || "PhucLongCNPMNC";
const DB_USER = process.env.DB_USER?.trim() || "phuclong_user";
const DB_PASSWORD = process.env.DB_PASSWORD?.trim() || "phuclong_pass";
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433;
const DB_INSTANCE = process.env.DB_INSTANCE?.trim() || null;

// 🔧 Chuẩn hóa server name
if (DB_SERVER === "(local)" || DB_SERVER.toLowerCase() === "local") {
  DB_SERVER = "localhost";
}

// =============================================================
// ⚙️ Build config động (instance / port)
// =============================================================
const config = {
  server: DB_SERVER,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  port: DB_PORT,
  options: {
    encrypt: false, // ❌ local false, ✅ Azure true
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

// Nếu có instance → bỏ port, thêm instanceName
if (DB_SERVER.includes("\\")) {
  delete config.port;
} else if (DB_INSTANCE) {
  config.options.instanceName = DB_INSTANCE;
  delete config.port;
}

// =============================================================
// 🧩 Logging cấu hình (ẩn mật khẩu)
// =============================================================
console.log("🛠️ SQL Config:", {
  server: config.server,
  instance: DB_INSTANCE || "(none)",
  database: config.database,
  user: config.user,
  port: config.port || "(instance mode)",
});

// =============================================================
// 🔁 Singleton Connection Pool (chuẩn hóa theo mssql@11)
// =============================================================
let pool;
let poolConnecting = false;

async function getPool() {
  try {
    // Nếu đã có pool đang hoạt động → trả về
    if (pool && pool.connected) return pool;

    // Nếu đang trong quá trình connect → đợi 500ms rồi thử lại
    if (poolConnecting) {
      await new Promise((res) => setTimeout(res, 500));
      return getPool();
    }

    poolConnecting = true;
    pool = new sql.ConnectionPool(config);

    pool.on("error", (err) => {
      console.error("⚠️ SQL Pool error:", err.message);
      pool = null;
    });

    await pool.connect();
    poolConnecting = false;

    console.log("✅ SQL Server: kết nối thành công!");
    return pool;
  } catch (err) {
    poolConnecting = false;
    console.error("❌ Lỗi kết nối SQL Server:", err.message);
    console.log("🔁 Sẽ thử kết nối lại sau 5 giây...");
    setTimeout(() => (pool = null), 5000);
    throw err;
  }
}

// =============================================================
// 🧠 Health Check tiện ích
// =============================================================
async function testConnection() {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT GETDATE() AS ServerTime");
    console.log("🧠 SQL Health Check:", result.recordset[0]);
  } catch (err) {
    console.error("❌ SQL Health Check Failed:", err.message);
  }
}

// testConnection();

// =============================================================
// 📤 Export module
// =============================================================
module.exports = { sql, getPool };
