const Attendance = require("../models/Attendance");

// Get today's attendance for an employee
exports.getTodayAttendance = async (req, res) => {
  const { employeeId } = req.params;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today

    const attendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    if (!attendance) return res.json(null);

    res.json({
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      expectedEnd: attendance.expectedEnd, // from work schedule
      overtimeCheckedOut: attendance.overtimeCheckedOut || false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Start overtime or check-out overtime
exports.startOvertime = async (req, res) => {
  const { employeeId } = req.params;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ employeeId, date: today });

    if (!attendance) return res.status(400).json({ error: "No attendance today" });

    if (!attendance.overtimeStart) {
      // Start overtime
      attendance.overtimeStart = new Date();
      await attendance.save();
      return res.json({ message: "Overtime started" });
    } else if (!attendance.overtimeCheckedOut) {
      // Check-out overtime
      attendance.overtimeEnd = new Date();
      attendance.overtimeCheckedOut = true;
      await attendance.save();
      return res.json({ message: "Overtime ended" });
    } else {
      return res.status(400).json({ error: "Overtime already completed" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
