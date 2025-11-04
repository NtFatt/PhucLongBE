// routes/voucher.routes.js
const express = require("express");
const { authenticateJWT } = require("../middleware/auth.middleware");
const VoucherController = require("../controllers/voucher.controller");

const router = express.Router();

// 🟢 Public: ai cũng xem được danh sách voucher
router.get("/available", VoucherController.listAvailable);

// ✅ Preview + Confirm cần đăng nhập
router.post("/preview", authenticateJWT, VoucherController.preview);
router.post("/confirm", authenticateJWT, VoucherController.confirm);

module.exports = router;
