const express = require("express");
const router = express.Router();
const {
  submitJustification,
  getEmployeeJustifications
} = require("../controllers/justificationController");

// Create a new justification request
router.post("/:employeeId", submitJustification);

// Get all justifications for a specific employee
router.get("/:employeeId", getEmployeeJustifications);

module.exports = router;
