const express = require("express");
const { authenticateJWT, authorizeAdmin } = require("../../middleware/auth.middleware");
const AdminCategoryController = require("../../controllers/admin/admin.category.controller");
const router = express.Router();

router.use(authenticateJWT, authorizeAdmin);

// 🟢 Các route danh mục
router.get("/", AdminCategoryController.getAll);
router.get("/:name", AdminCategoryController.getByName);
router.post("/", AdminCategoryController.create);
router.put("/:name", AdminCategoryController.update);
router.delete("/:name", AdminCategoryController.delete);

module.exports = router;
