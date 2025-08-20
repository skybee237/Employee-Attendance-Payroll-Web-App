const mongoose = require("mongoose");

const justificationSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  date: Date,
  reason: String,
  status: { type: String, enum: ["Pending","Approved","Rejected"], default: "Pending" }
});

module.exports = mongoose.model("Justification", justificationSchema);
