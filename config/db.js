// =============================================================
// 📦 SQL Server Connection (MSSQL + dotenv)
// -------------------------------------------------------------
// ✅ Hỗ trợ cả instance (SQLEXPRESS) lẫn cổng (1433)
// ✅ Tự động reconnect khi lỗi
// ✅ Chuẩn hóa cho Node.js 22 + mssql@11
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

// Chuẩn hóa tên server
if (DB_SERVER === "(local)" || DB_SERVER.toLowerCase() === "local") {
  DB_SERVER = "localhost";
}

// =============================================================
// ⚙️ Build Config động (instance / port)
// =============================================================
const config = {
  server: DB_SERVER,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  port: DB_PORT,
  options: {
    encrypt: false, // Azure dùng true
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
// 🔁 Singleton Connection Pool
// -------------------------------------------------------------
// - Đảm bảo chỉ có 1 pool hoạt động
// - Nếu mất kết nối, sẽ reset và tự reconnect
// =============================================================
let pool = null;
let connecting = false;

async function getPool() {
  try {
    if (pool && pool.connected) return pool;

    if (connecting) {
      await new Promise((res) => setTimeout(res, 300));
      return getPool();
    }

    connecting = true;
    pool = new sql.ConnectionPool(config);

    pool.on("error", (err) => {
      console.error("⚠️ SQL Pool error:", err.message);
      pool = null;
    });

    await pool.connect();
    connecting = false;

    console.log("✅ SQL Server: Kết nối thành công!");
    return pool;
  } catch (err) {
    connecting = false;
    console.error("❌ Lỗi kết nối SQL Server:", err.message);
    console.log("🔁 Sẽ thử lại sau 5 giây...");
    setTimeout(() => (pool = null), 5000);
    throw err;
  }
}

// =============================================================
// 🧠 Health Check (Tùy chọn)
// =============================================================
async function testConnection() {
  try {
    const pool = await getPool();
    const rs = await pool.request().query("SELECT GETDATE() AS ServerTime");
    console.log("🧠 SQL Health Check:", rs.recordset[0]);
  } catch (err) {
    console.error("❌ SQL Health Check Failed:", err.message);
  }
}

// testConnection(); // bật tạm để kiểm thử

// =============================================================
// 📤 Export
// =============================================================
module.exports = { sql, getPool };
