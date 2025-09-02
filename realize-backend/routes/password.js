const express = require("express");
const router = express.Router();
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const { requestPassword, getPendingRequests, approveRequest, changePassword } = require("../controllers/passwordController");

// Employee requests password reset
router.post("/request", requestPassword);

// Admin views pending requests
router.get("/pending", verifyToken, checkRole("admin"), getPendingRequests);

// Admin approves a request
router.post("/approve", verifyToken, checkRole("admin"), approveRequest);

// Employee changes their own password
router.post("/change", verifyToken, changePassword);

module.exports = router;
