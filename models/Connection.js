const mongoose = require("mongoose");

const ConnectionSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: {
    type: Date,
  },
});

// Ensure a user can't send multiple requests to the same person
ConnectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model("Connection", ConnectionSchema);
