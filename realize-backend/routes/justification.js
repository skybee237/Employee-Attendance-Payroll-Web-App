const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  submitJustification,
  getEmployeeJustifications
} = require("../controllers/justificationController");

// Create a new justification request
router.post("/:employeeId", verifyToken, submitJustification);

// Get all justifications for a specific employee
router.get("/:employeeId", verifyToken, getEmployeeJustifications);

module.exports = router;
