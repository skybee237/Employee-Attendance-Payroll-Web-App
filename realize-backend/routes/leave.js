const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { submitLeave, getEmployeeLeaves } = require("../controllers/leaveController");

// Submit a leave request
router.post("/:employeeId", verifyToken, submitLeave);

// Get all leaves of an employee
router.get("/:employeeId", verifyToken, getEmployeeLeaves);

module.exports = router;
