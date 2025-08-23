const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Project = require("../models/Project");
const User = require("../models/User");

// @route   GET /api/projects
// @desc    Get all projects (public)
// @access  Public
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("user", ["name", "email"])
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/projects/me
// @desc    Get current user's projects
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/projects/user/:userId
// @desc    Get projects by user ID
// @access  Public
router.get("/user/:userId", async (req, res) => {
  try {
    const projects = await Project.find({ user: req.params.userId })
      .populate("user", ["name", "email"])
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid user ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("user", ["name", "email"]);
    
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    
    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid project ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   POST /api/projects
// @desc    Create a project
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      technologies,
      projectImage,
      liveUrl,
      githubUrl,
      featured,
      status,
      startDate,
      endDate,
    } = req.body;

    // Validate required fields
    if (!title || !description || !technologies) {
      return res.status(400).json({ 
        msg: "Please provide title, description, and technologies" 
      });
    }

    const projectFields = {
      user: req.user.id,
      title,
      description,
      technologies: Array.isArray(technologies) 
        ? technologies 
        : technologies.split(",").map(tech => tech.trim()),
      projectImage: projectImage || "",
      liveUrl: liveUrl || "",
      githubUrl: githubUrl || "",
      featured: featured || false,
      status: status || "completed",
    };

    if (startDate) projectFields.startDate = startDate;
    if (endDate) projectFields.endDate = endDate;

    const project = new Project(projectFields);
    await project.save();

    // Populate user info before returning
    const populatedProject = await Project.findById(project._id)
      .populate("user", ["name", "email"]);

    res.json(populatedProject);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT /api/projects/:id
// @desc    Update a project
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      technologies,
      projectImage,
      liveUrl,
      githubUrl,
      featured,
      status,
      startDate,
      endDate,
    } = req.body;

    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    // Make sure user owns project
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    const projectFields = {};
    if (title) projectFields.title = title;
    if (description) projectFields.description = description;
    if (technologies) {
      projectFields.technologies = Array.isArray(technologies) 
        ? technologies 
        : technologies.split(",").map(tech => tech.trim());
    }
    if (projectImage !== undefined) projectFields.projectImage = projectImage;
    if (liveUrl !== undefined) projectFields.liveUrl = liveUrl;
    if (githubUrl !== undefined) projectFields.githubUrl = githubUrl;
    if (featured !== undefined) projectFields.featured = featured;
    if (status) projectFields.status = status;
    if (startDate) projectFields.startDate = startDate;
    if (endDate) projectFields.endDate = endDate;

    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: projectFields },
      { new: true }
    ).populate("user", ["name", "email"]);

    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid project ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    // Make sure user owns project
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await Project.findByIdAndRemove(req.params.id);
    res.json({ msg: "Project removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid project ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   GET /api/projects/featured/all
// @desc    Get all featured projects
// @access  Public
router.get("/featured/all", async (req, res) => {
  try {
    const projects = await Project.find({ featured: true })
      .populate("user", ["name", "email"])
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
