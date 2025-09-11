const LeaveRequest = require("../models/LeaveRequest");

// Submit a leave request
exports.submitLeave = async (req, res) => {
  const { employeeId } = req.params;
  const { reason, startDate, endDate, duration, leaveType } = req.body;

  // Helper function to calculate business days excluding weekends
  const calculateBusinessDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let count = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  try {
    // Validate duration matches business days between startDate and endDate
    const calculatedDuration = calculateBusinessDays(startDate, endDate);
    if (calculatedDuration !== duration) {
      return res.status(400).json({ error: "Duration does not match business days between start and end dates" });
    }

    const leave = new LeaveRequest({
      employeeId,
      reason,
      startDate,
      endDate,
      duration,
      leaveType,
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
