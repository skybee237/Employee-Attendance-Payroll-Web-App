const Employee = require("../models/Employee");
const LeaveRequest = require("../models/LeaveRequest");
const Justification = require("../models/Justification");

exports.getSubordinateLeaves = async (req, res) => {
  const { superiorId } = req.params;
  try {
    const subs = await Employee.find({ superiorId });
    const subIds = subs.map(s => s._id);

    const leaves = await LeaveRequest.find({ employeeId: { $in: subIds } });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubordinateJustifications = async (req, res) => {
  const { superiorId } = req.params;
  try {
    const subs = await Employee.find({ superiorId });
    const subIds = subs.map(s => s._id);

    const justifications = await Justification.find({ employeeId: { $in: subIds } });
    res.json(justifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Superior demands leave (submits to admin for approval)
exports.demandLeave = async (req, res) => {
  const { superiorId } = req.params;
  const { startDate, endDate, reason } = req.body;

  try {
    // Verify the user is actually a superior
    const superior = await Employee.findById(superiorId);
    if (!superior || superior.role !== 'superior') {
      return res.status(403).json({ error: "Only superiors can demand leaves" });
    }

    const leaveDemand = new LeaveRequest({
      superiorId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      type: "superior_demand",
      status: "Pending"
    });

    await leaveDemand.save();
    res.json({ success: true, message: "Leave demand submitted to admin", leaveDemand });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Superior submits justification to admin
exports.submitJustificationToAdmin = async (req, res) => {
  const { superiorId } = req.params;
  const { reason } = req.body;

  try {
    // Verify the user is actually a superior
    const superior = await Employee.findById(superiorId);
    if (!superior || superior.role !== 'superior') {
      return res.status(403).json({ error: "Only superiors can submit justifications to admin" });
    }

    const justification = new Justification({
      superiorId,
      reason,
      type: "superior",
      status: "Pending",
      date: new Date()
    });

    await justification.save();
    res.json({ success: true, message: "Justification submitted to admin", justification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get superior's own leave demands
exports.getSuperiorLeaveDemands = async (req, res) => {
  const { superiorId } = req.params;

  try {
    const leaveDemands = await LeaveRequest.find({ 
      superiorId, 
      type: "superior_demand" 
    }).sort({ createdAt: -1 });
    
    res.json(leaveDemands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get superior's own justifications to admin
exports.getSuperiorJustifications = async (req, res) => {
  const { superiorId } = req.params;

  try {
    const justifications = await Justification.find({
      superiorId,
      type: "superior"
    }).sort({ createdAt: -1 });

    res.json(justifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get subordinates for a superior
exports.getSubordinates = async (req, res) => {
  const { superiorId } = req.params;

  try {
    // Verify the user is actually a superior
    const superior = await Employee.findById(superiorId);
    if (!superior || superior.role !== 'superior') {
      return res.status(403).json({ error: "Only superiors can access this endpoint" });
    }

    const subordinates = await Employee.find({ superiorId }).select('-password');
    res.json(subordinates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Approve subordinate leave request
exports.approveSubordinateLeave = async (req, res) => {
  const { superiorId, leaveId } = req.params;
  const { status } = req.body; // Expected values: "Approved" or "Rejected"

  try {
    // Verify the user is actually a superior
    const superior = await Employee.findById(superiorId);
    if (!superior || superior.role !== 'superior') {
      return res.status(403).json({ error: "Only superiors can approve leave requests" });
    }

    // Find the leave request and verify it belongs to a subordinate
    const leaveRequest = await LeaveRequest.findById(leaveId);
    if (!leaveRequest) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    const subordinate = await Employee.findById(leaveRequest.employeeId);
    if (!subordinate || String(subordinate.superiorId) !== String(superiorId)) {
      return res.status(403).json({ error: "You can only approve leave requests of your subordinates" });
    }

    // Update the leave request status
    leaveRequest.status = status;
    await leaveRequest.save();

    res.json({ success: true, message: `Leave request ${status.toLowerCase()}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Approve subordinate justification request
exports.approveSubordinateJustification = async (req, res) => {
  const { superiorId, justificationId } = req.params;
  const { status } = req.body; // Expected values: "Approved" or "Rejected"

  try {
    // Verify the user is actually a superior
    const superior = await Employee.findById(superiorId);
    if (!superior || superior.role !== 'superior') {
      return res.status(403).json({ error: "Only superiors can approve justification requests" });
    }

    // Find the justification request and verify it belongs to a subordinate
    const justificationRequest = await Justification.findById(justificationId);
    if (!justificationRequest) {
      return res.status(404).json({ error: "Justification request not found" });
    }

    const subordinate = await Employee.findById(justificationRequest.employeeId);
    if (!subordinate || String(subordinate.superiorId) !== String(superiorId)) {
      return res.status(403).json({ error: "You can only approve justification requests of your subordinates" });
    }

    // Update the justification request status
    justificationRequest.status = status;
    await justificationRequest.save();

    res.json({ success: true, message: `Justification request ${status.toLowerCase()}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


