const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const employeeSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["employee","superior","admin"], default: "employee" },
  salary: { type: Number, default: function() {
    return this.role === "superior" ? 225000 : 125000;
  }},
  superiorId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
  profilePicture: { type: String, default: null }, // Path to profile picture file
  isActive: { type: Boolean, default: true }, // Account active status
  isSuspended: { type: Boolean, default: false }, // Suspension status
  suspensionReason: { type: String, default: null }, // Reason for suspension
  suspendedAt: { type: Date, default: null }, // Suspension timestamp
  reinstatedAt: { type: Date, default: null }, // Reinstatement timestamp
  twoFactorEnabled: { type: Boolean, default: false }, // 2FA enabled status
  twoFactorSecret: { type: String, default: null }, // 2FA secret key
  notificationPreferences: {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    leaveRequests: { type: Boolean, default: true },
    payrollUpdates: { type: Boolean, default: true }
  }
});

// Hash password before saving
employeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("Employee", employeeSchema);
