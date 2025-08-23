const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");

const router = express.Router();

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, "..", "uploads");
const projectsDir = path.join(uploadsDir, "projects");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, projectsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userId_timestamp_originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}_${uniqueSuffix}${ext}`);
  },
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// @route   POST /api/upload/project-image
// @desc    Upload project image
// @access  Private
router.post("/project-image", auth, upload.single("projectImage"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // Return the file path that can be used to access the image
    const imageUrl = `/uploads/projects/${req.file.filename}`;
    
    res.json({
      msg: "File uploaded successfully",
      imageUrl: imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ msg: "Server error during file upload" });
  }
});

// @route   DELETE /api/upload/project-image/:filename
// @desc    Delete uploaded project image
// @access  Private
router.delete("/project-image/:filename", auth, (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(projectsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ msg: "File not found" });
    }

    // Check if the file belongs to the user (filename should start with userId)
    if (!filename.startsWith(req.user.id + "_")) {
      return res.status(403).json({ msg: "Not authorized to delete this file" });
    }

    // Delete the file
    fs.unlinkSync(filepath);
    
    res.json({ msg: "File deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ msg: "Server error during file deletion" });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ msg: "File too large. Maximum size is 5MB." });
    }
  }
  
  if (error.message === "Only image files are allowed!") {
    return res.status(400).json({ msg: "Only image files are allowed!" });
  }
  
  res.status(500).json({ msg: "Server error during file upload" });
});

module.exports = router;
