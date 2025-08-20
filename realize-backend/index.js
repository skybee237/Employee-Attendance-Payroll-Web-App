require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const attendanceRoutes = require("./routes/attendance");
const leaveRoutes = require("./routes/leave");
const justificationRoutes = require("./routes/justification");
const superiorRoutes = require("./routes/superior");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const passwordRoutes = require("./routes/password");
const { verifyToken } = require("./middleware/authMiddleware");
const Employee = require("./models/Employee"); // adjust path if needed

const app = express();

// Allow CORS for frontend
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("MongoDB connected");
  
  // Create default admin after successful connection
  createDefaultAdmin();
})
.catch(err => console.error("MongoDB connection error:", err));

// Function to create default admin
async function createDefaultAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await Employee.findOne({ role: "admin" });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10); // default password
      const admin = new Employee({
        name: "System Admin",
        email: "admin@system.com",
        password: hashedPassword,
        role: "admin"
      });

      await admin.save();
      console.log("🛠 Default admin created:");
      console.log("Email: admin@system.com | Password: admin123");
    } else {
      console.log("ℹ️ Admin account already exists.");
    }
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
  }
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", verifyToken, attendanceRoutes);
app.use("/api/leave", verifyToken, leaveRoutes);
app.use("/api/justification", verifyToken, justificationRoutes);
app.use("/api/superior", verifyToken, superiorRoutes);
app.use("/api/admin", verifyToken, adminRoutes);
app.use("/api/password", passwordRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});