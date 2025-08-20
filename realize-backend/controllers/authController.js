const Employee = require("../models/Employee");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passwordValidator = require("../utils/passwordValidator");

const SITE_LOCATION = { lat: 5.614818, lng: -0.205874 };
const MAX_DISTANCE_METERS = 0; // User must be at the exact location

// Helper function to calculate distance
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Login endpoint
exports.login = async (req, res) => {
  const { email, password, latitude, longitude } = req.body;

  try {
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: "Email and password are required" 
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ 
        error: "Please provide a valid email address" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: "Password must be at least 6 characters long" 
      });
    }

    const user = await Employee.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        error: "Invalid email or password" 
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ 
        error: "Invalid email or password" 
      });
    }

    // Location validation for employees only
    if (user.role !== "admin") {
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          error: "Location data is required for employee login" 
        });
      }

      const distance = getDistanceFromLatLonInMeters(
        latitude,
        longitude,
        SITE_LOCATION.lat,
        SITE_LOCATION.lng
      );
      
      if (distance > MAX_DISTANCE_METERS) {
        return res.status(403).json({ 
          error: "You must be at the site location to login" 
        });
      }
    }

    // Check if the stored password meets complexity requirements
    // Note: We cannot validate the hashed password, so we'll check if this is a temporary password
    // or provide a warning to update password after login
    let passwordWarning = null;
    
    // Simple check for temporary passwords (hex strings from crypto.randomBytes)
    const isTemporaryPassword = user.password && user.password.length === 60 && /^[a-f0-9]+$/.test(user.password);
    
    if (isTemporaryPassword) {
      passwordWarning = {
        message: "You are using a temporary password. Please update your password immediately.",
        requirements: [
          "At least 8 characters long",
          "Contains at least one number",
          "Contains at least one uppercase letter",
          "Contains at least one lowercase letter",
          "Contains at least one special character"
        ]
      };
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ 
      token, 
      role: user.role, 
      employeeId: user._id,
      passwordWarning: passwordWarning
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await Employee.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  // Here you could notify the admin via email, or store a request in DB
  // For simplicity, we just log it
  console.log(`Password reset requested by ${email} for admin action.`);

  // Optionally, store a record in DB for admin to approve
  res.json({ message: "Password reset request sent to admin." });
};


// Optional: getRole endpoint for frontend pre-login
exports.getRole = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await Employee.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    res.json(user.role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
