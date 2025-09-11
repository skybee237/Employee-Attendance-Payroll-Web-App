const express = require("express");
const router = express.Router();
const { login, getRole, forgotPassword, logout, getProfile, updateProfile, setup2FA, verify2FA, disable2FA, getNotificationPreferences, updateNotificationPreferences } = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/login", login);
router.post("/getRole", getRole);
router.post("/forgot-password", forgotPassword);
router.post("/logout", logout);
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);

// 2FA routes
router.post("/2fa/setup", verifyToken, setup2FA);
router.post("/2fa/verify", verifyToken, verify2FA);
router.post("/2fa/disable", verifyToken, disable2FA);

// Notification preferences routes
router.get("/notifications", verifyToken, getNotificationPreferences);
router.put("/notifications", verifyToken, updateNotificationPreferences);

module.exports = router;
