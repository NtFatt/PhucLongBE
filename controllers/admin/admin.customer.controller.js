const AdminCustomerService = require("../../services/admin/admin.customer.service");

class AdminCustomerController {
  static async getAll(req, res) {
    try {
      const data = await AdminCustomerService.getAll();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const data = await AdminCustomerService.getById(req.params.id);
      res.json(data);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  static async update(req, res) {
    try {
      const data = await AdminCustomerService.update(req.params.id, req.body);
      res.json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async updatePassword(req, res) {
    try {
      const data = await AdminCustomerService.updatePassword(req.params.id, req.body.password);
      res.json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async updateStatus(req, res) {
    try {
      const data = await AdminCustomerService.updateStatus(req.params.id, req.body.isActive);
      res.json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async delete(req, res) {
    try {
      const data = await AdminCustomerService.delete(req.params.id);
      res.json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = AdminCustomerController;
