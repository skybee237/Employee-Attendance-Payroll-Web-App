const Justification = require("../models/Justification");

// Submit a justification
exports.submitJustification = async (req, res) => {
  const { employeeId } = req.params;
  const { reason } = req.body;

  try {
    const justification = new Justification({
      employeeId,
      reason,
      status: "Pending",
      dateSubmitted: new Date()
    });

    await justification.save();
    res.json({ success: true, message: "Justification submitted", justification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all justifications of an employee
exports.getEmployeeJustifications = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const justifications = await Justification.find({ employeeId });
    res.json(justifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
