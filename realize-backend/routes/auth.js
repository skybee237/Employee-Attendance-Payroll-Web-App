const express = require("express");
const router = express.Router();
const { login, getRole, forgotPassword, logout, getProfile, updateProfile } = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/login", login);
router.post("/getRole", getRole);
router.post("/forgot-password", forgotPassword);
router.post("/logout", logout);
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);

module.exports = router;
