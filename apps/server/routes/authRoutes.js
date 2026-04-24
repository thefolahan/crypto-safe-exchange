const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.patch("/plan", requireAuth, authController.selectPlan);
router.get("/admin/users", requireAuth, requireAdmin, authController.adminUsers);
router.patch("/admin/users/:userId/portfolio", requireAuth, requireAdmin, authController.adminUpdateUserPortfolio);

module.exports = router;
