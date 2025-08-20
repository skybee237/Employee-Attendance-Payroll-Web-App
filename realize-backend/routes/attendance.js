const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { getTodayAttendance } = require("../controllers/attendanceController");

// Get attendance for a specific employee
router.get("/:employeeId", verifyToken, getTodayAttendance);

module.exports = router;
