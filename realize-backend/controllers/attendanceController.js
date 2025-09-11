const Attendance = require("../models/Attendance");
const OFFICE_LOCATION = require("../config/location");
const { calculateDistance } = require("../utils/distanceCalculator");

// Get all attendance records for an employee
exports.getTodayAttendance = async (req, res) => {
  const { employeeId } = req.params;
  console.log("getTodayAttendance called with employeeId:", employeeId);

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    console.log("Invalid employeeId:", employeeId);
    return res.status(400).json({ error: "Invalid employeeId" });
  }

  try {
    const attendanceRecords = await Attendance.find({ employeeId }).sort({ date: -1 });

    const formattedRecords = attendanceRecords.map(record => ({
      _id: record._id,
      checkInTime: record.checkIn,
      checkOutTime: record.checkOut,
      date: record.date,
      expectedEnd: record.expectedEnd,
      overtimeStart: record.overtimeStart,
      overtimeEnd: record.overtimeEnd,
      overtimeCheckedOut: record.overtimeCheckedOut
    }));

    res.json(formattedRecords);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get today's attendance for all employees (for admin dashboard)
exports.getAllTodayAttendance = async (req, res) => {
  console.log("getAllTodayAttendance called");

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceRecords = await Attendance.find({ date: today });

    const formattedRecords = attendanceRecords.map(record => ({
      _id: record._id,
      employeeId: record.employeeId,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      date: record.date
    }));

    res.json(formattedRecords);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Employee check-in
const mongoose = require("mongoose");

exports.checkIn = async (req, res) => {
  const { employeeId } = req.params;
  const { latitude, longitude } = req.body;
  console.log("CheckIn called with employeeId:", employeeId);

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    console.log("Invalid employeeId:", employeeId);
    return res.status(400).json({ error: "Invalid employeeId" });
  }

  // Validate location data
  if (!latitude || !longitude) {
    return res.status(400).json({ error: "Location data is required for check-in" });
  }

  // Validate latitude and longitude ranges
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: "Invalid location coordinates" });
  }

  try {
    // Calculate distance from office location
    const distance = calculateDistance(
      latitude,
      longitude,
      OFFICE_LOCATION.latitude,
      OFFICE_LOCATION.longitude
    );

    console.log(`Distance from office: ${distance} meters`);
    console.log(`Allowed range: ${OFFICE_LOCATION.range} meters`);

    // Check if within allowed range
    if (distance > OFFICE_LOCATION.range) {
      return res.status(403).json({
        error: `You must be within ${OFFICE_LOCATION.range} meters of the office to check in. Current distance: ${Math.round(distance)} meters`
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log("Today date:", today);

    // Check if employee already checked in today
    let attendance = await Attendance.findOne({ employeeId, date: today });
    console.log("Existing attendance record:", attendance);

    if (attendance) {
      if (attendance.checkIn) {
        console.log("Already checked in today");
        return res.status(400).json({ error: "Already checked in today" });
      }
      // Update existing record with check-in time and location
      attendance.checkIn = new Date();
      attendance.checkInLat = latitude;
      attendance.checkInLng = longitude;
      console.log("Updating existing record with check-in time and location");
    } else {
      // Create new attendance record
      attendance = new Attendance({
        employeeId,
        date: today,
        checkIn: new Date(),
        checkInLat: latitude,
        checkInLng: longitude
      });
      console.log("Creating new attendance record");
    }

    console.log("Saving attendance record:", attendance);
    await attendance.save();
    console.log("Attendance saved successfully");
    res.json({
      message: "Check-in successful",
      checkInTime: attendance.checkIn,
      distance: Math.round(distance),
      location: { latitude, longitude }
    });
  } catch (err) {
    console.log("Error during check-in:", err);
    res.status(500).json({ error: err.message });
  }
};

// Employee check-out
exports.checkOut = async (req, res) => {
  const { employeeId } = req.params;
  const { latitude, longitude } = req.body;
  console.log("CheckOut called with employeeId:", employeeId);

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    console.log("Invalid employeeId:", employeeId);
    return res.status(400).json({ error: "Invalid employeeId" });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record
    const attendance = await Attendance.findOne({ employeeId, date: today });

    if (!attendance) {
      return res.status(400).json({ error: "No check-in recorded for today" });
    }

    if (!attendance.checkIn) {
      return res.status(400).json({ error: "Cannot check out without checking in first" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ error: "Already checked out today" });
    }

    // Check if current time is before 6pm (18:00)
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour < 18 || (currentHour === 18 && currentMinute < 0)) {
      return res.status(400).json({
        error: "Check-out is only allowed at or after 6:00 PM"
      });
    }

    // Update check-out time and location (if provided)
    attendance.checkOut = new Date();
    if (latitude && longitude) {
      // Validate coordinates if provided
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: "Invalid location coordinates" });
      }
      attendance.checkOutLat = latitude;
      attendance.checkOutLng = longitude;
    }
    await attendance.save();

    res.json({
      message: "Check-out successful",
      checkInTime: attendance.checkIn,
      checkOutTime: attendance.checkOut,
      hoursWorked: calculateHoursWorked(attendance.checkIn, attendance.checkOut),
      location: latitude && longitude ? { latitude, longitude } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper function to calculate hours worked
function calculateHoursWorked(checkIn, checkOut) {
  const msWorked = checkOut - checkIn;
  const hoursWorked = msWorked / (1000 * 60 * 60);
  return Math.round(hoursWorked * 100) / 100; // Round to 2 decimal places
}

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
