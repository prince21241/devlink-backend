const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Skill = require("../models/Skill");
const User = require("../models/User");

// @route   GET /api/skills/me
// @desc    Get current user's skills
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.user.id })
      .populate("projects", ["title"])
      .sort({ featured: -1, category: 1, name: 1 });
    res.json(skills);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/skills/user/:userId
// @desc    Get skills by user ID
// @access  Public
router.get("/user/:userId", async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.params.userId })
      .populate("user", ["name", "email"])
      .populate("projects", ["title"])
      .sort({ featured: -1, category: 1, name: 1 });
    res.json(skills);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid user ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   GET /api/skills/categories
// @desc    Get skill categories with counts
// @access  Private
router.get("/categories", auth, async (req, res) => {
  try {
    const categories = await Skill.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST /api/skills
// @desc    Create a skill
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const {
      name,
      category,
      proficiency,
      yearsOfExperience,
      description,
      featured,
      certifications,
    } = req.body;

    // Validate required fields
    if (!name || !category || !proficiency) {
      return res.status(400).json({ 
        msg: "Please provide skill name, category, and proficiency level" 
      });
    }

    // Check if skill already exists for this user
    const existingSkill = await Skill.findOne({ 
      user: req.user.id, 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existingSkill) {
      return res.status(400).json({ msg: "You already have this skill listed" });
    }

    const skillFields = {
      user: req.user.id,
      name: name.trim(),
      category,
      proficiency,
      yearsOfExperience: yearsOfExperience || 0,
      description: description ? description.trim() : "",
      featured: featured || false,
      certifications: certifications || [],
    };

    const skill = new Skill(skillFields);
    await skill.save();

    // Populate user info before returning
    const populatedSkill = await Skill.findById(skill._id)
      .populate("user", ["name", "email"])
      .populate("projects", ["title"]);

    res.json(populatedSkill);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ msg: "You already have this skill listed" });
    }
    res.status(500).send("Server error");
  }
});

// @route   PUT /api/skills/:id
// @desc    Update a skill
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const {
      name,
      category,
      proficiency,
      yearsOfExperience,
      description,
      featured,
      certifications,
    } = req.body;

    let skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ msg: "Skill not found" });
    }

    // Make sure user owns skill
    if (skill.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    const skillFields = {};
    if (name) skillFields.name = name.trim();
    if (category) skillFields.category = category;
    if (proficiency) skillFields.proficiency = proficiency;
    if (yearsOfExperience !== undefined) skillFields.yearsOfExperience = yearsOfExperience;
    if (description !== undefined) skillFields.description = description.trim();
    if (featured !== undefined) skillFields.featured = featured;
    if (certifications) skillFields.certifications = certifications;

    skill = await Skill.findByIdAndUpdate(
      req.params.id,
      { $set: skillFields },
      { new: true }
    ).populate("user", ["name", "email"])
     .populate("projects", ["title"]);

    res.json(skill);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid skill ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   DELETE /api/skills/:id
// @desc    Delete a skill
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ msg: "Skill not found" });
    }

    // Make sure user owns skill
    if (skill.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await Skill.findByIdAndRemove(req.params.id);
    res.json({ msg: "Skill removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid skill ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   POST /api/skills/:id/endorse
// @desc    Endorse a skill
// @access  Private
router.post("/:id/endorse", auth, async (req, res) => {
  try {
    const { message } = req.body;
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ msg: "Skill not found" });
    }

    // Can't endorse your own skill
    if (skill.user.toString() === req.user.id) {
      return res.status(400).json({ msg: "Cannot endorse your own skill" });
    }

    // Check if user already endorsed this skill
    const alreadyEndorsed = skill.endorsements.find(
      endorsement => endorsement.user.toString() === req.user.id
    );

    if (alreadyEndorsed) {
      return res.status(400).json({ msg: "You have already endorsed this skill" });
    }

    // Add endorsement
    skill.endorsements.unshift({
      user: req.user.id,
      message: message || "",
    });

    // Mark skill as endorsed if it has endorsements
    skill.isEndorsed = skill.endorsements.length > 0;

    await skill.save();

    const populatedSkill = await Skill.findById(skill._id)
      .populate("user", ["name", "email"])
      .populate("endorsements.user", ["name", "email"])
      .populate("projects", ["title"]);

    res.json(populatedSkill);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid skill ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   DELETE /api/skills/:id/endorse
// @desc    Remove endorsement from skill
// @access  Private
router.delete("/:id/endorse", auth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ msg: "Skill not found" });
    }

    // Check if user has endorsed this skill
    const endorsementIndex = skill.endorsements.findIndex(
      endorsement => endorsement.user.toString() === req.user.id
    );

    if (endorsementIndex === -1) {
      return res.status(400).json({ msg: "You have not endorsed this skill" });
    }

    // Remove endorsement
    skill.endorsements.splice(endorsementIndex, 1);

    // Update endorsed status
    skill.isEndorsed = skill.endorsements.length > 0;

    await skill.save();

    const populatedSkill = await Skill.findById(skill._id)
      .populate("user", ["name", "email"])
      .populate("endorsements.user", ["name", "email"])
      .populate("projects", ["title"]);

    res.json(populatedSkill);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid skill ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   GET /api/skills/search
// @desc    Search skills across all users
// @access  Public
router.get("/search", async (req, res) => {
  try {
    const { q, category, proficiency } = req.query;
    
    let query = {};
    
    if (q) {
      query.name = { $regex: q, $options: 'i' };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (proficiency) {
      query.proficiency = proficiency;
    }

    const skills = await Skill.find(query)
      .populate("user", ["name", "email"])
      .sort({ endorsements: -1, featured: -1, name: 1 })
      .limit(50);

    res.json(skills);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
