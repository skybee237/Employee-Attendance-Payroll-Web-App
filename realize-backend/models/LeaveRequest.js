const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  startDate: Date,
  endDate: Date,
  reason: String,
  status: { type: String, enum: ["Pending","Approved","Rejected"], default: "Pending" }
});

module.exports = mongoose.model("LeaveRequest", leaveSchema);
