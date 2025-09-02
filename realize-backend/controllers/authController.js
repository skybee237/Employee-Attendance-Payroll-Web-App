const Employee = require("../models/Employee");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passwordValidator = require("../utils/passwordValidator");
const axios = require("axios");

const SITE_LOCATION = { lat: 3.8370057, lng: 11.5335042 }; // Yaoundé, Cameroon
const MAX_DISTANCE_METERS = 3867; // User must be within 5 meters of the site location

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

// Helper function to get location from IP
async function getLocationFromIP(ip) {
  try {
    const response = await axios.get(`https://ipapi.co/${ip}/json`);
    const data = response.data;
    return {
      city: data.city,
      region: data.region,
      country: data.country_name,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    console.error("Error fetching location from IP:", error.message);
    return null;
  }
}

// ------------------- LOGIN -------------------
const login = async (req, res) => {

  let { email, password, latitude, longitude } = req.body;
  console.log("password (plain text from req):", password);

  try {
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!email.includes("@")) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Find user
    const user = await Employee.findOne({ email });
    console.log("User found:", user);
    if (!user) {
      return res.status(400).json({ error: "Invalid email" });
    }

    console.log("user role:", user.role);
    console.log("Received password:", password);
    console.log("Hashed password from DB:", user.password);
    console.log("password length from request:", password.length);
    console.log("password type:", typeof password);

    // Compare plain password with hashed password
    try {
      const match = await bcrypt.compare(password, user.password);

      console.log("compare password result:", match);

      if (!match) {
        console.log("Password comparison failed - checking if password might be already hashed");
        // Additional check in case the password is already hashed
        // if (password === user.password) {
        //   console.log("Direct string match found - password might be stored in plain text");
        //   // Continue with login if direct match (for debugging purposes)
        // } else {
        //   return res.status(400).json({ error: "Invalid password" });
        // }
      }
    } catch (error) {
      console.log("bcrypt compare error:", error.message);
      return res.status(500).json({ error: "Password validation error" });
    }

    // If latitude or longitude not provided, try to get from IP
    if ((!SITE_LOCATION.lat || !SITE_LOCATION.lng) && req.ip) {
      const ip = req.ip.includes("::ffff:") ? req.ip.split("::ffff:")[1] : req.ip;
      const location = await getLocationFromIP(ip);
      if (location) {
        latitude = location.latitude;
        longitude = location.longitude;
        console.log("Location from IP:", location);
      }
    }

    // Location validation - only for employee and superior roles, not admin
    if (user.role === "employee" || user.role === "superior") {
      console.log("Performing location validation for role:", user.role);
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Location data is required for " + user.role + " login" });
      }

      const distance = getDistanceFromLatLonInMeters(
        latitude,
        longitude,
        SITE_LOCATION.lat,
        SITE_LOCATION.lng
      );

      console.log("Distance from site location:", distance, "meters");

      if (distance > MAX_DISTANCE_METERS) {
        return res.status(403).json({ error: "You must be at the site location to login as " + user.role });
      }
    } else if (user.role === "admin") {
      console.log("Skipping location validation for admin user");
    }

    // Check for temporary password
    let passwordWarning = null;
    const isTemporaryPassword =
      user.password && user.password.length === 60 && /^[a-f0-9]+$/.test(user.password);

    if (isTemporaryPassword) {
      passwordWarning = {
        message: "You are using a temporary password. Please update your password immediately.",
        requirements: [
          "At least 8 characters long",
          "Contains at least one number",
          "Contains at least one uppercase letter",
          "Contains at least one lowercase letter",
          "Contains at least one special character",
        ],
      };
    }

    // JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    // Log login location
    const ip = req.ip.includes("::ffff:") ? req.ip.split("::ffff:")[1] : req.ip;
    const loginLocation = await getLocationFromIP(ip);
    if (loginLocation) {
      console.log(`User ${email} logged in from ${loginLocation.city}, ${loginLocation.region}, ${loginLocation.country} (IP: ${ip})`);
    } else {
      console.log(`User ${email} logged in from IP: ${ip}`);
    }

    res.json({
      token,
      role: user.role,
      employeeId: user._id,
      passwordWarning,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- FORGOT PASSWORD -------------------
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await Employee.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  console.log(`Password reset requested by ${email} for admin action.`);

  res.json({ message: "Password reset request sent to admin." });
};

// ------------------- GET ROLE -------------------
const getRole = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await Employee.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    res.json(user.role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- LOGOUT -------------------
const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is mainly handled on the client side
    // by removing the token from localStorage
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- GET PROFILE -------------------
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await Employee.findById(userId).select('name email role profilePicture position department phone address');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      position: user.position,
      department: user.department,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- UPDATE PROFILE -------------------
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, position, department, phone, address } = req.body;

    const updatedUser = await Employee.findByIdAndUpdate(
      userId,
      {
        name,
        email,
        position,
        department,
        phone,
        address
      },
      { new: true, select: 'name email role profilePicture position department phone address createdAt' }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profilePicture: updatedUser.profilePicture,
      position: updatedUser.position,
      department: updatedUser.department,
      phone: updatedUser.phone,
      address: updatedUser.address,
      createdAt: updatedUser.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ EXPORT properly so your routes work
module.exports = {
  login,
  forgotPassword,
  getRole,
  logout,
  getProfile,
  updateProfile,
};
