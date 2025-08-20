const express = require("express");
const router = express.Router();
const { login, getRole } = require("../controllers/authController");
const { forgotPassword } = require("../controllers/authController");


router.post("/login", login);
router.post("/getRole", getRole);
router.post("/forgot-password", forgotPassword);

module.exports = router;
