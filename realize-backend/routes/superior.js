const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  getSubordinateLeaves,
  getSubordinateJustifications,
  demandLeave,
  submitJustificationToAdmin,
  getSuperiorLeaveDemands,
  getSuperiorJustifications,
  getSubordinates,
  approveSubordinateLeave,
  approveSubordinateJustification
} = require("../controllers/superiorController");

// Subordinate management
router.get("/leaves/:superiorId", verifyToken, getSubordinateLeaves);
router.get("/justifications/:superiorId", verifyToken, getSubordinateJustifications);
router.get("/subordinates/:superiorId", verifyToken, getSubordinates);

// Superior leave demands and justifications
router.post("/demand-leave/:superiorId", verifyToken, demandLeave);
router.post("/submit-justification/:superiorId", verifyToken, submitJustificationToAdmin);
router.get("/leave-demands/:superiorId", verifyToken, getSuperiorLeaveDemands);
router.get("/justifications-to-admin/:superiorId", verifyToken, getSuperiorJustifications);

// Approval endpoints for subordinates
router.put("/approve-leave/:superiorId/:leaveId", verifyToken, approveSubordinateLeave);
router.put("/approve-justification/:superiorId/:justificationId", verifyToken, approveSubordinateJustification);

module.exports = router;
