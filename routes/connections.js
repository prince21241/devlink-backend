const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Connection = require("../models/Connection");
const User = require("../models/User");
const Profile = require("../models/Profile");
const Notification = require("../models/Notification");

// @route   POST /api/connections/request
// @desc    Send a connection request
// @access  Private
router.post("/request", auth, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user.id;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Can't send request to yourself
    if (requesterId === recipientId) {
      return res.status(400).json({ msg: "Cannot send connection request to yourself" });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingConnection) {
      return res.status(400).json({ msg: "Connection request already exists" });
    }

    // Create new connection request
    const connection = new Connection({
      requester: requesterId,
      recipient: recipientId,
    });

    await connection.save();

    // Create notification for recipient
    const requester = await User.findById(requesterId);
    await Notification.createNotification({
      recipient: recipientId,
      sender: requesterId,
      type: "connection_request",
      message: `${requester.name} sent you a connection request`,
      relatedConnection: connection._id
    });

    // Populate the connection with user details
    const populatedConnection = await Connection.findById(connection._id)
      .populate("requester", ["name", "email"])
      .populate("recipient", ["name", "email"]);

    res.json(populatedConnection);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/connections/requests/received
// @desc    Get received connection requests
// @access  Private
router.get("/requests/received", auth, async (req, res) => {
  try {
    const connections = await Connection.find({
      recipient: req.user.id,
      status: "pending"
    })
      .populate("requester", ["name", "email"])
      .sort({ requestedAt: -1 });

    // Also populate profile pictures
    const connectionsWithProfiles = await Promise.all(
      connections.map(async (connection) => {
        const profile = await Profile.findOne({ user: connection.requester._id });
        return {
          ...connection.toObject(),
          requester: {
            ...connection.requester.toObject(),
            profilePicture: profile?.profilePicture || null
          }
        };
      })
    );

    res.json(connectionsWithProfiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/connections/requests/sent
// @desc    Get sent connection requests
// @access  Private
router.get("/requests/sent", auth, async (req, res) => {
  try {
    const connections = await Connection.find({
      requester: req.user.id,
      status: "pending"
    })
      .populate("recipient", ["name", "email"])
      .sort({ requestedAt: -1 });

    // Also populate profile pictures
    const connectionsWithProfiles = await Promise.all(
      connections.map(async (connection) => {
        const profile = await Profile.findOne({ user: connection.recipient._id });
        return {
          ...connection.toObject(),
          recipient: {
            ...connection.recipient.toObject(),
            profilePicture: profile?.profilePicture || null
          }
        };
      })
    );

    res.json(connectionsWithProfiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT /api/connections/:id/accept
// @desc    Accept a connection request
// @access  Private
router.put("/:id/accept", auth, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ msg: "Connection request not found" });
    }

    // Only the recipient can accept
    if (connection.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    if (connection.status !== "pending") {
      return res.status(400).json({ msg: "Connection request already processed" });
    }

    connection.status = "accepted";
    connection.respondedAt = Date.now();
    await connection.save();

    // Create notification for requester that their request was accepted
    const recipient = await User.findById(req.user.id);
    await Notification.createNotification({
      recipient: connection.requester,
      sender: req.user.id,
      type: "connection_accepted",
      message: `${recipient.name} accepted your connection request`,
      relatedConnection: connection._id
    });

    const populatedConnection = await Connection.findById(connection._id)
      .populate("requester", ["name", "email"])
      .populate("recipient", ["name", "email"]);

    res.json(populatedConnection);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT /api/connections/:id/reject
// @desc    Reject a connection request
// @access  Private
router.put("/:id/reject", auth, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ msg: "Connection request not found" });
    }

    // Only the recipient can reject
    if (connection.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    if (connection.status !== "pending") {
      return res.status(400).json({ msg: "Connection request already processed" });
    }

    connection.status = "rejected";
    connection.respondedAt = Date.now();
    await connection.save();

    res.json({ msg: "Connection request rejected" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/connections
// @desc    Get user's connections (accepted connections)
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [
        { requester: req.user.id, status: "accepted" },
        { recipient: req.user.id, status: "accepted" }
      ]
    })
      .populate("requester", ["name", "email"])
      .populate("recipient", ["name", "email"])
      .sort({ respondedAt: -1 });

    // Format connections to show the other person
    const formattedConnections = await Promise.all(
      connections.map(async (connection) => {
        const otherUser = connection.requester._id.toString() === req.user.id 
          ? connection.recipient 
          : connection.requester;
        
        const profile = await Profile.findOne({ user: otherUser._id });
        
        return {
          _id: connection._id,
          user: {
            ...otherUser.toObject(),
            profilePicture: profile?.profilePicture || null,
            bio: profile?.bio || null,
            location: profile?.location || null,
            skills: profile?.skills || []
          },
          connectedAt: connection.respondedAt,
          connectionId: connection._id
        };
      })
    );

    res.json(formattedConnections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE /api/connections/:id
// @desc    Remove a connection
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ msg: "Connection not found" });
    }

    // Only users involved in the connection can remove it
    if (connection.requester.toString() !== req.user.id && connection.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    await Connection.findByIdAndRemove(req.params.id);
    res.json({ msg: "Connection removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/connections/suggestions
// @desc    Get connection suggestions (users not already connected)
// @access  Private
router.get("/suggestions", auth, async (req, res) => {
  try {
    // Get all users this user is already connected to or has pending requests with
    const existingConnections = await Connection.find({
      $or: [
        { requester: req.user.id },
        { recipient: req.user.id }
      ]
    });

    const connectedUserIds = existingConnections.map(conn => 
      conn.requester.toString() === req.user.id ? conn.recipient : conn.requester
    );
    
    // Add current user to exclude list
    connectedUserIds.push(req.user.id);

    // Find users not in the connected list
    const suggestions = await User.find({
      _id: { $nin: connectedUserIds }
    }).select("name email").limit(10);

    // Get profiles for suggestions
    const suggestionsWithProfiles = await Promise.all(
      suggestions.map(async (user) => {
        const profile = await Profile.findOne({ user: user._id });
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: profile?.profilePicture || null,
          bio: profile?.bio || null,
          location: profile?.location || null,
          skills: profile?.skills || []
        };
      })
    );

    res.json(suggestionsWithProfiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
