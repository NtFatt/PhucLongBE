const { sql, getPool } = require("../config/db");

const EmployeeModel = {
  async create({ Name, Email, Phone, PasswordHash, Role, BranchId = null }) {
    const pool = await getPool();
    await pool.request()
      .input("Name", sql.NVarChar, Name)
      .input("Email", sql.NVarChar, Email)
      .input("Phone", sql.NVarChar, Phone)
      .input("PasswordHash", sql.NVarChar, PasswordHash)
      .input("Role", sql.NVarChar, Role)
      .input("BranchId", sql.Int, BranchId)
      .query(`
        INSERT INTO Employees (Name, Email, Phone, PasswordHash, Role, BranchId)
        VALUES (@Name, @Email, @Phone, @PasswordHash, @Role, @BranchId)
      `);
  },

  async findByEmail(email) {
    const pool = await getPool();
    const result = await pool.request()
      .input("Email", sql.NVarChar, email)
      .query(`
        SELECT *
        FROM Employees
        WHERE Email = @Email AND IsActive = 1
      `);
    return result.recordset[0];
  },

  async findAll() {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT *
      FROM Employees
      ORDER BY CreatedAt DESC
    `);
    return result.recordset;
  },

  async updateStatus(id, isActive) {
    const pool = await getPool();
    await pool.request()
      .input("Id", sql.Int, id)
      .input("IsActive", sql.Bit, isActive)
      .query(`
        UPDATE Employees
        SET IsActive = @IsActive
        WHERE Id = @Id
      `);
  }
};

module.exports = EmployeeModel;
