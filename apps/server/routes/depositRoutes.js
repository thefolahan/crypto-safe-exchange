const express = require("express");
const depositController = require("../controllers/depositController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/me", requireAuth, depositController.myDeposits);
router.post("/", requireAuth, depositController.createDeposit);
router.get("/admin", requireAuth, requireAdmin, depositController.adminDeposits);
router.patch("/admin/:depositId", requireAuth, requireAdmin, depositController.adminReviewDeposit);

module.exports = router;
