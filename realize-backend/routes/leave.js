const express = require("express");
const router = express.Router();
const { submitLeave, getEmployeeLeaves } = require("../controllers/leaveController");

// Submit a leave request
router.post("/:employeeId", submitLeave);

// Get all leaves of an employee
router.get("/:employeeId", getEmployeeLeaves);

module.exports = router;
