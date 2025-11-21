const AdminEmployeeService = require("../../services/admin/admin.employee.service");

class AdminEmployeeController {
  static async getAll(req, res) {
    try {
      const data = await AdminEmployeeService.getAll();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async create(req, res) {
    try {
      const result = await AdminEmployeeService.create(req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const result = await AdminEmployeeService.update(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async updateStatus(req, res) {
    try {
      const result = await AdminEmployeeService.updateStatus(
        req.params.id,
        req.body.isActive
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async updatePassword(req, res) {
    try {
      const result = await AdminEmployeeService.updatePassword(
        req.params.id,
        req.body.password
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async delete(req, res) {
    try {
      const result = await AdminEmployeeService.delete(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = AdminEmployeeController;
