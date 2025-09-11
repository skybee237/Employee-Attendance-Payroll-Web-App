const mongoose = require("mongoose");

const PasswordRequestSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  email: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  requestedAt: { type: Date, default: Date.now },
  resetToken: { type: String },
  tokenExpiry: { type: Date },
  type: { type: String, enum: ["admin_reset", "self_reset"], default: "admin_reset" },
});

module.exports = mongoose.model("PasswordRequest", PasswordRequestSchema);
