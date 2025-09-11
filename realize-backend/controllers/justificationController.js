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

// Update justification status (for admin)
exports.updateJustificationStatus = async (req, res) => {
  const { justificationId } = req.params;
  const { status } = req.body;

  try {
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'Approved' or 'Rejected'" });
    }

    const justification = await Justification.findByIdAndUpdate(
      justificationId,
      {
        status,
        processedAt: new Date()
      },
      { new: true }
    );

    if (!justification) {
      return res.status(404).json({ error: "Justification not found" });
    }

    res.json({
      success: true,
      message: `Justification ${status.toLowerCase()}`,
      justification
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
