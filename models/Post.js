const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  postType: {
    type: String,
    enum: ["text", "image", "link", "project", "achievement"],
    default: "text",
  },
  image: {
    type: String, // URL to uploaded image
    trim: true,
  },
  link: {
    url: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
  },
  tags: [{
    type: String,
    trim: true,
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      date: {
        type: Date,
        default: Date.now,
      },
    }],
  }],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  visibility: {
    type: String,
    enum: ["public", "connections", "private"],
    default: "public",
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now,
    },
  }],
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
PostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for like count
PostSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
PostSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Virtual for share count
PostSchema.virtual('shareCount').get(function() {
  return this.shares ? this.shares.length : 0;
});

// Include virtuals when converting to JSON
PostSchema.set('toJSON', { virtuals: true });
PostSchema.set('toObject', { virtuals: true });

// Index for efficient querying
PostSchema.index({ user: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ visibility: 1, createdAt: -1 });

module.exports = mongoose.model("Post", PostSchema);
