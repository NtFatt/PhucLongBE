const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { getPool } = require("../../config/db");

exports.employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const pool = await getPool();
    const result = await pool
      .request()
      .input("Email", email)
      .query("SELECT * FROM Employees WHERE Email = @Email AND IsActive = 1");

    const user = result.recordset[0];

    if (!user) {
      return res.status(400).json({ ok: false, message: "Email không tồn tại hoặc bị khóa" });
    }

    const valid = await bcrypt.compare(password, user.PasswordHash);
    if (!valid) {
      return res.status(400).json({ ok: false, message: "Sai mật khẩu" });
    }

    const accessToken = jwt.sign(
      { id: user.Id, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      ok: true,
      accessToken,
      employee: {
        id: user.Id,
        name: user.Name,
        role: user.Role,
        email: user.Email,
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};
