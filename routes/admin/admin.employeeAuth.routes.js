const express = require("express");
const router = express.Router();
const { employeeLogin } = require("../../controllers/admin/employeeAuth.controller");

router.post("/login", employeeLogin);

module.exports = router;
