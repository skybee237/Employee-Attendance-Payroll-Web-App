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

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const employeeId = req.user.id; // Assuming authMiddleware sets req.user

  try {
    // Find the employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, employee.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Check if new password matches confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New password and confirmation do not match" });
    }

    // Validate new password
    const validation = passwordValidator.validatePassword(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Password does not meet requirements",
        details: validation.errors
      });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the employee's password
    employee.password = hashedNewPassword;
    await employee.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
