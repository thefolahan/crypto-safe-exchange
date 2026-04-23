const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.get("/admin/users", requireAuth, requireAdmin, authController.adminUsers);

module.exports = router;
