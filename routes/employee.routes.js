const express = require("express");
const router = express.Router();
const controller = require("../controllers/employee.controller");
const { authorizeAdmin } = require("../middleware/auth.middleware");

router.post("/", authorizeAdmin, controller.create);
router.post("/login", controller.login);
router.get("/", authorizeAdmin, controller.list);

module.exports = router;
