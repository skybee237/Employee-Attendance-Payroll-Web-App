const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  superiorId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
  startDate: Date,
  endDate: Date,
  reason: String,
  duration: { type: Number, default: 0 },
  type: { 
    type: String, 
    enum: ["employee", "superior_demand"], 
    default: "employee" 
  },
  status: { type: String, enum: ["Pending","Approved","Rejected"], default: "Pending" },
  adminNotes: { type: String, default: "" }
}, {
  timestamps: true
});

module.exports = mongoose.model("LeaveRequest", leaveSchema);
