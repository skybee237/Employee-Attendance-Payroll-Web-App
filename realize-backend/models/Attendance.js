const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date },
  checkInLat: { type: Number },
  checkInLng: { type: Number },
  checkOutLat: { type: Number },
  checkOutLng: { type: Number },
  expectedEnd: { type: Date }, // scheduled end time
  overtimeStart: { type: Date },
  overtimeEnd: { type: Date },
  overtimeCheckedOut: { type: Boolean, default: false }
});

module.exports = mongoose.model("Attendance", attendanceSchema);
