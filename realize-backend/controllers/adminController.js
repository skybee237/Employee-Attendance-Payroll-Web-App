const Employee = require("../models/Employee");
const LeaveRequest = require("../models/LeaveRequest");
const Justification = require("../models/Justification");
const Attendance = require("../models/Attendance");
const crypto = require("crypto");
const passwordValidator = require("../utils/passwordValidator");

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

    const employee = new Employee({
      name,
      email,
      password: finalPassword,
      role,
      superiorId: processedSuperiorId
    });
    await employee.save();

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
    const employees = await Employee.find().select('-password');
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
    const justifications = await Justification.find();
    res.json(justifications);
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
