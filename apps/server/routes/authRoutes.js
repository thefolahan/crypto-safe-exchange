const express = require("express");
const multer = require("multer");
const path = require("path");
const authController = require("../controllers/authController");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads");

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, "_");
        cb(null, `${Date.now()}_${safeName}`);
    },
});

function fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
        return cb(new Error("Only image files are allowed (jpg, png, webp)."), false);
    }
    cb(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/register", upload.single("profilePicture"), authController.register);
router.post("/login", authController.login);

module.exports = router;
