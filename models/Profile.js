const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bio: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  skills: {
    type: [String],
    required: true,
  },
  profilePicture: {
    type: String,
    default: "", // can be a placeholder image later
  },
  social: {
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    twitter: { type: String, default: "" },
  },
  experience: [
    {
      title: { type: String, required: true },
      company: String,
      location: String,
      from: { type: Date, required: true },
      to: Date,
      current: { type: Boolean, default: false },
      description: String,
    },
  ],
  education: [
    {
      school: { type: String, required: true },
      degree: String,
      fieldOfStudy: String,
      from: { type: Date, required: true },
      to: Date,
      current: { type: Boolean, default: false },
      description: String,
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Profile", ProfileSchema);
