const express = require("express");
const settingsController = require("../controllers/settingsController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/public", settingsController.publicSettings);
router.get("/admin", requireAuth, requireAdmin, settingsController.adminSettings);
router.patch("/admin", requireAuth, requireAdmin, settingsController.updateAdminSettings);

module.exports = router;
