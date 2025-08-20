const PasswordRequest = require("../models/PasswordRequest");
const Employee = require("../models/Employee");
const bcrypt = require("bcrypt");
const passwordValidator = require("../utils/passwordValidator");

// Employee requests a password reset
exports.requestPassword = async (req, res) => {
  const { employeeId, email } = req.body;

  const existingRequest = await PasswordRequest.findOne({ employeeId, status: "pending" });
  if (existingRequest) return res.status(400).json({ error: "Request already pending" });

  const request = await PasswordRequest.create({ employeeId, email });
  res.json({ message: "Password reset request sent to admin", request });
};

// Admin views pending requests
exports.getPendingRequests = async (req, res) => {
  const requests = await PasswordRequest.find({ status: "pending" }).populate("employeeId", "name email");
  res.json(requests);
};

// Admin approves a request
exports.approveRequest = async (req, res) => {
  const { requestId, newPassword } = req.body;
  const request = await PasswordRequest.findById(requestId);
  if (!request) return res.status(404).json({ error: "Request not found" });

  // Validate new password
  const validation = passwordValidator.validatePassword(newPassword);
  if (!validation.isValid) {
    return res.status(400).json({ 
      error: "Password does not meet requirements", 
      details: validation.errors 
    });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await Employee.findByIdAndUpdate(request.employeeId, { password: hashed });
  request.status = "approved";
  await request.save();

  res.json({ message: "Password reset approved" });
};

// Employee changes their own password
exports.changePassword = async (req, res) => {
  const { employeeId, currentPassword, newPassword } = req.body;

  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, employee.password);
    if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });

    // Validate new password
    const validation = passwordValidator.validatePassword(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: "Password does not meet requirements", 
        details: validation.errors 
      });
    }

    // Hash and save new password
    const hashed = await bcrypt.hash(newPassword, 10);
    employee.password = hashed;
    await employee.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
