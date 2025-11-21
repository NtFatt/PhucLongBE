const bcrypt = require("bcrypt");
const EmployeeModel = require("../models/employee.model");
const jwt = require("jsonwebtoken");

class EmployeeService {
  static async createEmployee({ Name, Email, Phone, Password, Role, BranchId }) {
    const existing = await EmployeeModel.findByEmail(Email);
    if (existing) throw new Error("Email nhân viên đã tồn tại");

    const hash = await bcrypt.hash(Password, 10);

    await EmployeeModel.create({
      Name,
      Email,
      Phone,
      PasswordHash: hash,
      Role,
      BranchId,
    });

    return { message: "Tạo nhân viên thành công" };
  }

  static async login({ Email, Password }) {
    const employee = await EmployeeModel.findByEmail(Email);
    if (!employee) throw new Error("Email hoặc mật khẩu không đúng");

    const match = await bcrypt.compare(Password, employee.PasswordHash);
    if (!match) throw new Error("Email hoặc mật khẩu không đúng");

    const token = jwt.sign(
      {
        id: employee.Id,
        role: employee.Role,
        email: employee.Email
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return {
      token,
      employee: {
        id: employee.Id,
        name: employee.Name,
        email: employee.Email,
        role: employee.Role
      }
    };
  }

  static async getEmployeeList() {
    return EmployeeModel.findAll();
  }
}

module.exports = EmployeeService;
