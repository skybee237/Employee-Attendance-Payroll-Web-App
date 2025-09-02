const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Employee = require("../models/Employee");
const { verifyToken } = require("../middleware/authMiddleware");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profile-pictures/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

// File filter for image types
function fileFilter(req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
}

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: fileFilter
});

// POST /api/profile-picture/upload
router.post("/upload", verifyToken, upload.single("profilePicture"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.user.id;
    const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;

    // Update employee document
    const updatedUser = await Employee.findByIdAndUpdate(
      userId,
      { profilePicture: profilePicturePath },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Profile picture uploaded successfully", profilePicture: profilePicturePath });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ error: "Server error during file upload" });
  }
});

module.exports = router;
