const express = require("express");
const router = express.Router();
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const {
  submitJustification,
  getEmployeeJustifications,
  updateJustificationStatus
} = require("../controllers/justificationController");

// Create a new justification request
router.post("/:employeeId", verifyToken, submitJustification);

// Get all justifications for a specific employee
router.get("/:employeeId", verifyToken, getEmployeeJustifications);

// Update justification status (admin only)
router.put("/:justificationId/status", verifyToken, checkRole("admin"), updateJustificationStatus);

module.exports = router;
