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
