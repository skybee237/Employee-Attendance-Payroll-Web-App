const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

// Calculate payroll for an employee for a specific month
exports.calculatePayroll = async (req, res) => {
  const { employeeId } = req.params;
  const { year, month } = req.query; // month 1-12, year 4-digit

  try {
    // Validate employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Get attendance records for the month
    const startDate = new Date(year, month - 1, 1); // month is 0-indexed
    const endDate = new Date(year, month, 1);

    const attendanceRecords = await Attendance.find({
      employeeId,
      date: {
        $gte: startDate,
        $lt: endDate
      }
    });

    // Calculate total hours worked
    let totalHoursWorked = 0;
    attendanceRecords.forEach(record => {
      if (record.checkIn && record.checkOut) {
        const hours = calculateHoursWorked(record.checkIn, record.checkOut);
        totalHoursWorked += hours;
      }
    });

    // Assume 30 working days, 8 hours each = 240 hours
    const expectedHours = 240;
    const absenceHours = Math.max(0, expectedHours - totalHoursWorked);

    // Deductions: 20000 for every 60 hours of absence
    const deductionAmount = Math.floor(absenceHours / 60) * 20000;

    // Net salary
    const netSalary = Math.max(0, employee.salary - deductionAmount);

    res.json({
      employeeId,
      employeeName: employee.name,
      role: employee.role,
      baseSalary: employee.salary,
      month,
      year,
      totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
      expectedHours,
      absenceHours: Math.round(absenceHours * 100) / 100,
      deductions: deductionAmount,
      netSalary
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get payroll for all employees for a specific month
exports.getAllPayroll = async (req, res) => {
  const { year, month } = req.query; // month 1-12, year 4-digit

  // Validate query parameters
  if (!year || !month) {
    return res.status(400).json({ error: "Year and month query parameters are required" });
  }

  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);

  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return res.status(400).json({ error: "Invalid year parameter. Must be a number between 2000 and 2100" });
  }

  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({ error: "Invalid month parameter. Must be a number between 1 and 12" });
  }

  try {
    // Get all active employees
    const employees = await Employee.find({ isActive: true });

    if (!employees || employees.length === 0) {
      return res.json([]); // Return empty array if no employees found
    }

    const payrollData = [];

    for (const employee of employees) {
      try {
        // Validate employee data
        if (!employee.name || !employee.role || typeof employee.salary !== 'number') {
          console.warn(`Skipping employee ${employee._id}: missing required fields`);
          continue;
        }

        // Get attendance records for the month
        const startDate = new Date(yearNum, monthNum - 1, 1); // month is 0-indexed
        const endDate = new Date(yearNum, monthNum, 1);

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error(`Invalid date range for year ${yearNum}, month ${monthNum}`);
          continue;
        }

        const attendanceRecords = await Attendance.find({
          employeeId: employee._id,
          date: {
            $gte: startDate,
            $lt: endDate
          }
        });

        // Calculate total hours worked
        let totalHoursWorked = 0;
        attendanceRecords.forEach(record => {
          if (record.checkIn && record.checkOut) {
            try {
              const hours = calculateHoursWorked(record.checkIn, record.checkOut);
              if (!isNaN(hours) && hours >= 0) {
                totalHoursWorked += hours;
              }
            } catch (calcError) {
              console.warn(`Error calculating hours for attendance record ${record._id}:`, calcError.message);
            }
          }
        });

        // Assume 30 working days, 8 hours each = 240 hours
        const expectedHours = 240;
        const absenceHours = Math.max(0, expectedHours - totalHoursWorked);

        // Deductions: 20000 for every 60 hours of absence
        const deductionAmount = Math.floor(absenceHours / 60) * 20000;

        // Net salary
        const netSalary = Math.max(0, employee.salary - deductionAmount);

        payrollData.push({
          employeeId: employee._id,
          employeeName: employee.name,
          role: employee.role,
          baseSalary: employee.salary,
          month: monthNum,
          year: yearNum,
          totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
          expectedHours,
          absenceHours: Math.round(absenceHours * 100) / 100,
          deductions: deductionAmount,
          netSalary
        });
      } catch (employeeError) {
        console.error(`Error processing employee ${employee._id}:`, employeeError.message);
        // Continue processing other employees
      }
    }

    res.json(payrollData);

  } catch (err) {
    console.error("Error in getAllPayroll:", err);
    res.status(500).json({ error: "Internal server error occurred while fetching payroll data" });
  }
};

// Helper function to calculate hours worked (same as in attendanceController)
function calculateHoursWorked(checkIn, checkOut) {
  const msWorked = checkOut - checkIn;
  const hoursWorked = msWorked / (1000 * 60 * 60);
  return Math.round(hoursWorked * 100) / 100; // Round to 2 decimal places
}
