const express = require("express");
const router = express.Router();
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const payrollController = require("../controllers/payrollController");

// Calculate payroll for an employee
router.get("/:employeeId", verifyToken, payrollController.calculatePayroll);

// Get payroll for all employees (admin only)
router.get("/all", verifyToken, checkRole("admin"), payrollController.getAllPayroll);

module.exports = router;
