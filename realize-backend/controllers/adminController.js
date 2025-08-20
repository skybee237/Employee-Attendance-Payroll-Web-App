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
    
    const employee = new Employee({ 
      name, 
      email, 
      password: finalPassword,
      role, 
      superiorId 
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

    res.json({
      totalEmployees,
      totalLeaves,
      totalJustifications,
      todayAttendance,
      pendingLeaves,
      pendingJustifications
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
