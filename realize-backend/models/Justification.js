const mongoose = require("mongoose");

const justificationSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  superiorId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
  date: Date,
  reason: String,
  type: { 
    type: String, 
    enum: ["employee", "superior"], 
    default: "employee" 
  },
  status: { type: String, enum: ["Pending","Approved","Rejected"], default: "Pending" },
  adminNotes: { type: String, default: "" },
  processedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model("Justification", justificationSchema);
