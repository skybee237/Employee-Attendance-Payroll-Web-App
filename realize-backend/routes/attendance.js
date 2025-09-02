const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { getTodayAttendance, getAllTodayAttendance, checkIn, checkOut } = require("../controllers/attendanceController");

// Get attendance for a specific employee
router.get("/:employeeId", verifyToken, getTodayAttendance);

// Get today's attendance for all employees (for admin dashboard)
router.get("/today/all", verifyToken, getAllTodayAttendance);

// Employee check-in
router.post("/checkin/:employeeId", verifyToken, checkIn);

// Employee check-out
router.post("/checkout/:employeeId", verifyToken, checkOut);

module.exports = router;
