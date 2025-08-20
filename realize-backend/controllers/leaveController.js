const LeaveRequest = require("../models/LeaveRequest");

// Submit a leave request
exports.submitLeave = async (req, res) => {
  const { employeeId } = req.params;
  const { reason } = req.body;

  try {
    const leave = new LeaveRequest({
      employeeId,
      reason,
      status: "Pending",
      dateRequested: new Date()
    });

    await leave.save();
    res.json({ success: true, message: "Leave request submitted", leave });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all leaves of an employee
exports.getEmployeeLeaves = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const leaves = await LeaveRequest.find({ employeeId });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
