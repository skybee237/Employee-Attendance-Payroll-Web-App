const express = require("express");
const router = express.Router();
const { requestPassword, getPendingRequests, approveRequest, changePassword } = require("../controllers/passwordController");

// Employee requests password reset
router.post("/request", requestPassword);

// Admin views pending requests
router.get("/pending", getPendingRequests);

// Admin approves a request
router.post("/approve", approveRequest);

// Employee changes their own password
router.post("/change", changePassword);

module.exports = router;
