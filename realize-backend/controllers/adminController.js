const Employee = require("../models/Employee");
const LeaveRequest = require("../models/LeaveRequest");
const Justification = require("../models/Justification");
const Attendance = require("../models/Attendance");
const crypto = require("crypto");
const passwordValidator = require("../utils/passwordValidator");
const { sendEmployeeCredentials, sendSuspensionNotification } = require("../utils/emailService");

exports.createEmployee = async (req, res) => {
  const { name, email, role, superiorId, password } = req.body;
  try {
    let finalPassword;

    // If password is provided, validate it
    if (password) {
      const validation = passwordValidator.validatePassword(password);
      if (!validation.isValid) {
        return res.status(400).json({
          error: "Password does not meet requirements",
          details: validation.errors
        });
      }
      finalPassword = password;
    } else {
      // Generate a secure temporary password that meets requirements
      finalPassword = passwordValidator.generateValidPassword();
    }

    // Handle empty superiorId
    const processedSuperiorId = superiorId && superiorId !== "" ? superiorId : null;

    const baseSalary = role === "superior" ? 225000 : 125000;

    const employee = new Employee({
      name,
      email,
      password: finalPassword,
      role,
      salary: baseSalary,
      superiorId: processedSuperiorId
    });
    await employee.save();

    // Send credentials email
    try {
      await sendEmployeeCredentials(email, finalPassword);
    } catch (emailError) {
      console.error('Failed to send credentials email:', emailError);
      // Don't fail the creation if email fails
    }

    // Return employee without password for security
    const employeeResponse = employee.toObject();
    delete employeeResponse.password;

    res.json({
      success: true,
      message: "Employee account created",
      employee: employeeResponse,
      tempPassword: password ? undefined : finalPassword // Only send temp password if generated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSuperiors = async (req, res) => {
  try {
    const superiors = await Employee.find({ role: "superior" }).select('name email _id');
    res.json(superiors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .select('-password')
      .populate('superiorId', 'name email')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find();
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllJustifications = async (req, res) => {
  try {
    const justifications = await Justification.find()
      .populate('employeeId', 'name')
      .sort({ createdAt: -1 });
    res.json(justifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get admin dashboard statistics
// Suspend an employee account
exports.suspendEmployee = async (req, res) => {
  const { employeeId } = req.params;
  const { reason } = req.body;

  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    employee.isSuspended = true;
    employee.isActive = false;
    employee.suspensionReason = reason || "No reason provided";
    employee.suspendedAt = new Date();
    employee.reinstatedAt = null;

    await employee.save();

    // Send suspension notification email
    try {
      await sendSuspensionNotification(employee.email, employee.suspensionReason);
    } catch (emailError) {
      console.error('Failed to send suspension notification email:', emailError);
      // Don't fail the suspension if email fails
    }

    res.json({ success: true, message: "Employee suspended", employee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete an employee account
exports.deleteEmployee = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const employee = await Employee.findByIdAndDelete(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ success: true, message: "Employee deleted", employee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reinstate a suspended employee account
exports.reinstateEmployee = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    employee.isSuspended = false;
    employee.isActive = true;
    employee.suspensionReason = null;
    employee.reinstatedAt = new Date();

    await employee.save();

    res.json({ success: true, message: "Employee reinstated", employee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update employee details
exports.updateEmployee = async (req, res) => {
  const { employeeId } = req.params;
  const updateData = req.body;

  try {
    const employee = await Employee.findByIdAndUpdate(employeeId, updateData, { new: true });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ success: true, message: "Employee updated", employee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get admin dashboard statistics
exports.getAdminStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total counts
    const totalEmployees = await Employee.countDocuments();
    const totalLeaves = await LeaveRequest.countDocuments();
    const totalJustifications = await Justification.countDocuments();

    // Get today's attendance count
    const todayAttendance = await Attendance.countDocuments({ date: today });

    // Get pending leaves and justifications
    const pendingLeaves = await LeaveRequest.countDocuments({ status: 'pending' });
    const pendingJustifications = await Justification.countDocuments({ status: 'pending' });

    // Get pending superior demands
    const pendingSuperiorLeaves = await LeaveRequest.countDocuments({
      type: 'superior_demand',
      status: 'Pending'
    });
    const pendingSuperiorJustifications = await Justification.countDocuments({
      type: 'superior',
      status: 'Pending'
    });

    res.json({
      totalEmployees,
      totalLeaves,
      totalJustifications,
      todayAttendance,
      pendingLeaves,
      pendingJustifications,
      pendingSuperiorLeaves,
      pendingSuperiorJustifications
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all superior leave demands
exports.getSuperiorLeaveDemands = async (req, res) => {
  try {
    const leaveDemands = await LeaveRequest.find({ type: 'superior_demand' })
      .populate('superiorId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(leaveDemands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all superior justifications
exports.getSuperiorJustifications = async (req, res) => {
  try {
    const justifications = await Justification.find({ type: 'superior' })
      .populate('superiorId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(justifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Approve or reject superior leave demand
exports.processSuperiorLeaveDemand = async (req, res) => {
  const { leaveId } = req.params;
  const { status, adminNotes } = req.body;

  try {
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'Approved' or 'Rejected'" });
    }

    const leaveDemand = await LeaveRequest.findByIdAndUpdate(
      leaveId,
      { 
        status,
        adminNotes: adminNotes || '',
        processedAt: new Date()
      },
      { new: true }
    ).populate('superiorId', 'name email');

    if (!leaveDemand) {
      return res.status(404).json({ error: "Leave demand not found" });
    }

    res.json({ 
      success: true, 
      message: `Leave demand ${status.toLowerCase()}`,
      leaveDemand 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Approve or reject superior justification
exports.processSuperiorJustification = async (req, res) => {
  const { justificationId } = req.params;
  const { status, adminNotes } = req.body;

  try {
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'Approved' or 'Rejected'" });
    }

    const justification = await Justification.findByIdAndUpdate(
      justificationId,
      { 
        status,
        adminNotes: adminNotes || '',
        processedAt: new Date()
      },
      { new: true }
    ).populate('superiorId', 'name email');

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
