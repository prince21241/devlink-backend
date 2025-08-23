const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Post = require("../models/Post");
const User = require("../models/User");
const Connection = require("../models/Connection");
const Notification = require("../models/Notification");

// @route   GET /api/posts
// @desc    Get feed posts (public posts + posts from connections)
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get user's connections
    const connections = await Connection.find({
      $or: [
        { requester: req.user.id, status: "accepted" },
        { recipient: req.user.id, status: "accepted" }
      ]
    });

    const connectedUserIds = connections.map(conn => 
      conn.requester.toString() === req.user.id ? conn.recipient : conn.requester
    );
    
    // Include current user's posts and connected users' posts
    connectedUserIds.push(req.user.id);

    const posts = await Post.find({
      $or: [
        { visibility: "public" },
        { user: { $in: connectedUserIds }, visibility: { $in: ["public", "connections"] } }
      ]
    })
      .populate("user", ["name", "email"])
      .populate("project", ["title", "projectImage"])
      .populate("comments.user", ["name", "email"])
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add profile pictures to posts and comments
    const Profile = require("../models/Profile");
    const postsWithProfiles = await Promise.all(
      posts.map(async (post) => {
        // Get post author's profile picture
        const userProfile = await Profile.findOne({ user: post.user._id });
        
        // Get profile pictures for all commenters
        const commentsWithProfiles = await Promise.all(
          post.comments.map(async (comment) => {
            const commentUserProfile = await Profile.findOne({ user: comment.user._id });
            return {
              ...comment.toObject(),
              user: {
                ...comment.user.toObject(),
                profilePicture: commentUserProfile?.profilePicture || null
              }
            };
          })
        );

        return {
          ...post.toObject(),
          user: {
            ...post.user.toObject(),
            profilePicture: userProfile?.profilePicture || null
          },
          comments: commentsWithProfiles
        };
      })
    );

    res.json(postsWithProfiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/posts/me
// @desc    Get current user's posts
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id })
      .populate("user", ["name", "email"])
      .populate("project", ["title", "projectImage"])
      .populate("comments.user", ["name", "email"])
      .sort({ isPinned: -1, createdAt: -1 });

    // Add profile pictures to posts and comments
    const Profile = require("../models/Profile");
    const postsWithProfiles = await Promise.all(
      posts.map(async (post) => {
        // Get post author's profile picture
        const userProfile = await Profile.findOne({ user: post.user._id });
        
        // Get profile pictures for all commenters
        const commentsWithProfiles = await Promise.all(
          post.comments.map(async (comment) => {
            const commentUserProfile = await Profile.findOne({ user: comment.user._id });
            return {
              ...comment.toObject(),
              user: {
                ...comment.user.toObject(),
                profilePicture: commentUserProfile?.profilePicture || null
              }
            };
          })
        );

        return {
          ...post.toObject(),
          user: {
            ...post.user.toObject(),
            profilePicture: userProfile?.profilePicture || null
          },
          comments: commentsWithProfiles
        };
      })
    );

    res.json(postsWithProfiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/posts/user/:userId
// @desc    Get posts by user ID
// @access  Public
router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ 
      user: req.params.userId,
      visibility: { $in: ["public"] }
    })
      .populate("user", ["name", "email"])
      .populate("project", ["title", "projectImage"])
      .populate("comments.user", ["name", "email"])
      .sort({ isPinned: -1, createdAt: -1 });

    // Add profile pictures to posts and comments
    const Profile = require("../models/Profile");
    const postsWithProfiles = await Promise.all(
      posts.map(async (post) => {
        // Get post author's profile picture
        const userProfile = await Profile.findOne({ user: post.user._id });
        
        // Get profile pictures for all commenters
        const commentsWithProfiles = await Promise.all(
          post.comments.map(async (comment) => {
            const commentUserProfile = await Profile.findOne({ user: comment.user._id });
            return {
              ...comment.toObject(),
              user: {
                ...comment.user.toObject(),
                profilePicture: commentUserProfile?.profilePicture || null
              }
            };
          })
        );

        return {
          ...post.toObject(),
          user: {
            ...post.user.toObject(),
            profilePicture: userProfile?.profilePicture || null
          },
          comments: commentsWithProfiles
        };
      })
    );

    res.json(postsWithProfiles);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid user ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   GET /api/posts/:id
// @desc    Get post by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", ["name", "email"])
      .populate("project", ["title", "projectImage"])
      .populate("comments.user", ["name", "email"]);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Add profile pictures to post and comments
    const Profile = require("../models/Profile");
    
    // Get post author's profile picture
    const userProfile = await Profile.findOne({ user: post.user._id });
    
    // Get profile pictures for all commenters
    const commentsWithProfiles = await Promise.all(
      post.comments.map(async (comment) => {
        const commentUserProfile = await Profile.findOne({ user: comment.user._id });
        return {
          ...comment.toObject(),
          user: {
            ...comment.user.toObject(),
            profilePicture: commentUserProfile?.profilePicture || null
          }
        };
      })
    );

    const postWithProfiles = {
      ...post.toObject(),
      user: {
        ...post.user.toObject(),
        profilePicture: userProfile?.profilePicture || null
      },
      comments: commentsWithProfiles
    };

    res.json(postWithProfiles);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid post ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   POST /api/posts
// @desc    Create a post
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const {
      content,
      postType,
      image,
      link,
      project,
      tags,
      visibility
    } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ msg: "Post content is required" });
    }

    const postFields = {
      user: req.user.id,
      content: content.trim(),
      postType: postType || "text",
      visibility: visibility || "public"
    };

    if (image) postFields.image = image;
    if (link) postFields.link = link;
    if (project) postFields.project = project;
    if (tags && Array.isArray(tags)) {
      postFields.tags = tags.map(tag => tag.trim()).filter(tag => tag);
    }

    const post = new Post(postFields);
    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate("user", ["name", "email"])
      .populate("project", ["title", "projectImage"])
      .populate("comments.user", ["name", "email"]);

    res.json(populatedPost);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const { content, tags, visibility } = req.body;

    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Make sure user owns post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Save edit history
    if (content && content !== post.content) {
      post.editHistory.push({
        content: post.content,
        editedAt: new Date()
      });
      post.isEdited = true;
    }

    const postFields = {};
    if (content) postFields.content = content.trim();
    if (visibility) postFields.visibility = visibility;
    if (tags && Array.isArray(tags)) {
      postFields.tags = tags.map(tag => tag.trim()).filter(tag => tag);
    }

    post = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: postFields },
      { new: true }
    )
      .populate("user", ["name", "email"])
      .populate("project", ["title", "projectImage"])
      .populate("comments.user", ["name", "email"]);

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid post ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Make sure user owns post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await Post.findByIdAndRemove(req.params.id);
    res.json({ msg: "Post removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid post ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like/Unlike a post
// @access  Private
router.post("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if post is already liked
    const likeIndex = post.likes.findIndex(
      like => like.user.toString() === req.user.id
    );

    if (likeIndex > -1) {
      // Unlike the post
      post.likes.splice(likeIndex, 1);
    } else {
      // Like the post
      post.likes.unshift({ user: req.user.id });
      
      // Create notification for post author (only when liking, not unliking)
      if (post.user.toString() !== req.user.id) {
        const liker = await User.findById(req.user.id);
        await Notification.createNotification({
          recipient: post.user,
          sender: req.user.id,
          type: "post_like",
          message: `${liker.name} liked your post`,
          relatedPost: post._id
        });
      }
    }

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate("user", ["name", "email"])
      .populate("project", ["title", "projectImage"])
      .populate("comments.user", ["name", "email"]);

    res.json(populatedPost);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid post ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   POST /api/posts/:id/comment
// @desc    Add comment to post
// @access  Private
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ msg: "Comment content is required" });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const newComment = {
      user: req.user.id,
      content: content.trim(),
    };

    post.comments.unshift(newComment);
    await post.save();

    // Create notification for post author (only if commenter is not the author)
    if (post.user.toString() !== req.user.id) {
      const commenter = await User.findById(req.user.id);
      await Notification.createNotification({
        recipient: post.user,
        sender: req.user.id,
        type: "post_comment",
        message: `${commenter.name} commented on your post`,
        relatedPost: post._id,
        relatedComment: newComment._id
      });
    }

    let populatedPost = await Post.findById(post._id)
      .populate("user", ["name", "email"])
      .populate("project", ["title", "projectImage"])
      .populate("comments.user", ["name", "email"]);

    // Add profile pictures to comments
    const Profile = require("../models/Profile");
    const commentsWithProfiles = await Promise.all(
      populatedPost.comments.map(async (comment) => {
        const userProfile = await Profile.findOne({ user: comment.user._id });
        return {
          ...comment.toObject(),
          user: {
            ...comment.user.toObject(),
            profilePicture: userProfile?.profilePicture || null
          }
        };
      })
    );

    const postWithProfilePictures = {
      ...populatedPost.toObject(),
      comments: commentsWithProfiles
    };

    res.json(postWithProfilePictures);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid post ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   DELETE /api/posts/:id/comment/:commentId
// @desc    Delete comment from post
// @access  Private
router.delete("/:id/comment/:commentId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const comment = post.comments.find(
      comment => comment._id.toString() === req.params.commentId
    );

    if (!comment) {
      return res.status(404).json({ msg: "Comment not found" });
    }

    // Make sure user owns comment or owns post
    if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    post.comments = post.comments.filter(
      comment => comment._id.toString() !== req.params.commentId
    );

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate("user", ["name", "email"])
      .populate("project", ["title", "projectImage"])
      .populate("comments.user", ["name", "email"]);

    res.json(populatedPost);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid post or comment ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   POST /api/posts/:id/pin
// @desc    Pin/Unpin a post
// @access  Private
router.post("/:id/pin", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Make sure user owns post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    post.isPinned = !post.isPinned;
    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate("user", ["name", "email"])
      .populate("project", ["title", "projectImage"])
      .populate("comments.user", ["name", "email"]);

    res.json(populatedPost);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid post ID" });
    }
    res.status(500).send("Server error");
  }
});

module.exports = router;
