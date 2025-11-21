const express = require("express");
const router = express.Router();
const AdminEmployeeController = require("../../controllers/admin/admin.employee.controller");

// GET tất cả nhân viên
router.get("/", AdminEmployeeController.getAll);           // NO ( ) !!!

// Tạo mới nhân viên
router.post("/", AdminEmployeeController.create);

// Cập nhật nhân viên
router.put("/:id", AdminEmployeeController.update);

// Active / inactive
router.patch("/:id/status", AdminEmployeeController.updateStatus);

// Đổi mật khẩu
router.patch("/:id/password", AdminEmployeeController.updatePassword);

// Xoá nhân viên
router.delete("/:id", AdminEmployeeController.delete);

module.exports = router;
