const express = require("express");
const router = express.Router();
const AdminCustomerController = require("../../controllers/admin/admin.customer.controller");

// GET tất cả khách hàng
router.get("/", AdminCustomerController.getAll);

// GET chi tiết 1 khách hàng
router.get("/:id", AdminCustomerController.getById);

// Cập nhật thông tin khách hàng
router.put("/:id", AdminCustomerController.update);

// Đổi mật khẩu khách hàng
router.patch("/:id/password", AdminCustomerController.updatePassword);

// Khóa / mở khóa tài khoản
router.patch("/:id/status", AdminCustomerController.updateStatus);

// Xoá khách hàng
router.delete("/:id", AdminCustomerController.delete);

module.exports = router;
