const express = require("express");
const router = express.Router();
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const {
  createEmployee,
  listEmployees,
  getAllLeaves,
  getAllJustifications,
  getAdminStats,
  getSuperiorLeaveDemands,
  getSuperiorJustifications,
  processSuperiorLeaveDemand,
  processSuperiorJustification,
  getSuperiors
} = require("../controllers/adminController");

router.post("/create", verifyToken, checkRole("admin"), createEmployee);           // Create employee
router.get("/superiors", verifyToken, getSuperiors);           // Get list of superiors
router.get("/employees", verifyToken, checkRole("admin"), listEmployees);          // List all employees
router.get("/leaves", verifyToken, checkRole("admin"), getAllLeaves);              // Admin sees all leaves
router.get("/justifications", verifyToken, checkRole("admin"), getAllJustifications); // Admin sees all justifications
router.get("/stats", verifyToken, checkRole("admin"), getAdminStats);              // Admin dashboard statistics

// Superior management routes
router.get("/superior/leave-demands", verifyToken, checkRole("admin"), getSuperiorLeaveDemands);
router.get("/superior/justifications", verifyToken, checkRole("admin"), getSuperiorJustifications);
router.put("/superior/leave-demand/:leaveId", verifyToken, checkRole("admin"), processSuperiorLeaveDemand);
router.put("/superior/justification/:justificationId", verifyToken, checkRole("admin"), processSuperiorJustification);

module.exports = router;
