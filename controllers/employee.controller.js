const EmployeeService = require("../services/employee.service");

exports.create = async (req, res) => {
  try {
    const data = await EmployeeService.createEmployee(req.body);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const data = await EmployeeService.login(req.body);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const data = await EmployeeService.getEmployeeList();
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
