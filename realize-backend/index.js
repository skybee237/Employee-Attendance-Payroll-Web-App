require("dotenv").config();
const express = require("express");
const cors = require("cors");

const attendanceRoutes = require("./routes/attendance");
const leaveRoutes = require("./routes/leave");
const justificationRoutes = require("./routes/justification");
const superiorRoutes = require("./routes/superior");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const passwordRoutes = require("./routes/password");
const profilePictureRoutes = require("./routes/profilePicture");
const payrollRoutes = require("./routes/payroll");
const { verifyToken } = require("./middleware/authMiddleware");


const databaseManager = require("./utils/DatabaseManager"); // ✅ Import central DB logic

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// ✅ Connect to DB and initialize
(async () => {
  try {
    await databaseManager.connect(process.env.MONGO_URI);
    console.log("✅ Database ready");
  } catch (err) {
    console.error("❌ Failed to connect to database:", err.message);
    process.exit(1);
  }
})();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/attendance", verifyToken, attendanceRoutes);
app.use("/api/leave", verifyToken, leaveRoutes);
app.use("/api/justification", verifyToken, justificationRoutes);
app.use("/api/superior", verifyToken, superiorRoutes);
app.use("/api/admin", verifyToken, adminRoutes);
app.use("/api/profile-picture", verifyToken, profilePictureRoutes);
app.use("/api/payroll", verifyToken, payrollRoutes);
app.use("/api/password", passwordRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
