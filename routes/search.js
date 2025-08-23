const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Profile = require("../models/Profile");
const Post = require("../models/Post");
const Connection = require("../models/Connection");

// @route   GET /api/search/users
// @desc    Search for users by name or email
// @access  Private
router.get("/users", auth, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }
    
    const searchQuery = q.trim();
    const skip = (page - 1) * limit;
    
    // Search users by name or email (case insensitive)
    const users = await User.find({
      _id: { $ne: req.user.id }, // Exclude current user
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ]
    })
    .select("name email")
    .skip(skip)
    .limit(parseInt(limit));

    // Get profiles and connection status for each user
    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        const profile = await Profile.findOne({ user: user._id });
        
        // Check connection status
        const connection = await Connection.findOne({
          $or: [
            { requester: req.user.id, recipient: user._id },
            { requester: user._id, recipient: req.user.id }
          ]
        });
        
        let connectionStatus = 'none';
        if (connection) {
          if (connection.status === 'accepted') {
            connectionStatus = 'connected';
          } else if (connection.status === 'pending') {
            connectionStatus = connection.requester.toString() === req.user.id ? 'sent' : 'received';
          }
        }
        
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: profile?.profilePicture || null,
          bio: profile?.bio || null,
          location: profile?.location || null,
          skills: profile?.skills || [],
          connectionStatus
        };
      })
    );

    res.json(usersWithProfiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/search/posts
// @desc    Search for posts by content or tags
// @access  Private
router.get("/posts", auth, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }
    
    const searchQuery = q.trim();
    const skip = (page - 1) * limit;
    
    // Get user's connections for filtering
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
    
    // Search posts by content or tags
    const posts = await Post.find({
      $and: [
        {
          $or: [
            { visibility: "public" },
            { user: { $in: connectedUserIds }, visibility: { $in: ["public", "connections"] } }
          ]
        },
        {
          $or: [
            { content: { $regex: searchQuery, $options: 'i' } },
            { tags: { $in: [new RegExp(searchQuery, 'i')] } }
          ]
        }
      ]
    })
    .populate("user", ["name", "email"])
    .populate("project", ["title", "projectImage"])
    .populate("comments.user", ["name", "email"])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Add profile pictures to posts and comments
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

// @route   GET /api/search/all
// @desc    Search for both users and posts
// @access  Private
router.get("/all", auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({ users: [], posts: [] });
    }

    // Get both users and posts with limited results
    const [usersResponse, postsResponse] = await Promise.all([
      // Simulate calling our own routes
      new Promise(async (resolve) => {
        req.query.limit = 5; // Limit for combined search
        try {
          const users = await User.find({
            _id: { $ne: req.user.id },
            $or: [
              { name: { $regex: q.trim(), $options: 'i' } },
              { email: { $regex: q.trim(), $options: 'i' } }
            ]
          })
          .select("name email")
          .limit(5);

          const usersWithProfiles = await Promise.all(
            users.map(async (user) => {
              const profile = await Profile.findOne({ user: user._id });
              const connection = await Connection.findOne({
                $or: [
                  { requester: req.user.id, recipient: user._id },
                  { requester: user._id, recipient: req.user.id }
                ]
              });
              
              let connectionStatus = 'none';
              if (connection) {
                if (connection.status === 'accepted') {
                  connectionStatus = 'connected';
                } else if (connection.status === 'pending') {
                  connectionStatus = connection.requester.toString() === req.user.id ? 'sent' : 'received';
                }
              }
              
              return {
                _id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: profile?.profilePicture || null,
                bio: profile?.bio || null,
                location: profile?.location || null,
                skills: profile?.skills || [],
                connectionStatus
              };
            })
          );
          
          resolve(usersWithProfiles);
        } catch (err) {
          resolve([]);
        }
      }),
      
      new Promise(async (resolve) => {
        try {
          const connections = await Connection.find({
            $or: [
              { requester: req.user.id, status: "accepted" },
              { recipient: req.user.id, status: "accepted" }
            ]
          });

          const connectedUserIds = connections.map(conn => 
            conn.requester.toString() === req.user.id ? conn.recipient : conn.requester
          );
          connectedUserIds.push(req.user.id);
          
          const posts = await Post.find({
            $and: [
              {
                $or: [
                  { visibility: "public" },
                  { user: { $in: connectedUserIds }, visibility: { $in: ["public", "connections"] } }
                ]
              },
              {
                $or: [
                  { content: { $regex: q.trim(), $options: 'i' } },
                  { tags: { $in: [new RegExp(q.trim(), 'i')] } }
                ]
              }
            ]
          })
          .populate("user", ["name", "email"])
          .populate("project", ["title", "projectImage"])
          .sort({ createdAt: -1 })
          .limit(5);

          const postsWithProfiles = await Promise.all(
            posts.map(async (post) => {
              const userProfile = await Profile.findOne({ user: post.user._id });
              return {
                ...post.toObject(),
                user: {
                  ...post.user.toObject(),
                  profilePicture: userProfile?.profilePicture || null
                }
              };
            })
          );
          
          resolve(postsWithProfiles);
        } catch (err) {
          resolve([]);
        }
      })
    ]);

    res.json({
      users: usersResponse,
      posts: postsResponse
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
