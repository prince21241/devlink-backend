const mongoose = require("mongoose");

const SkillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Frontend",
      "Backend", 
      "Database",
      "Mobile",
      "DevOps",
      "Cloud",
      "Testing",
      "Design",
      "Languages",
      "Frameworks",
      "Tools",
      "Other"
    ],
  },
  proficiency: {
    type: String,
    required: true,
    enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
    default: "Intermediate",
  },
  yearsOfExperience: {
    type: Number,
    min: 0,
    max: 50,
  },
  description: {
    type: String,
    trim: true,
  },
  isEndorsed: {
    type: Boolean,
    default: false,
  },
  endorsements: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    message: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
  }],
  certifications: [{
    name: {
      type: String,
      required: true,
    },
    issuer: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
    },
    url: {
      type: String,
    },
  }],
  featured: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
SkillSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure user can't have duplicate skills with same name
SkillSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Skill", SkillSchema);
