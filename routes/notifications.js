const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Notification = require("../models/Notification");
const Profile = require("../models/Profile");

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", ["name", "email"])
      .populate("relatedPost", ["content", "postType"])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add profile pictures to notifications
    const notificationsWithProfiles = await Promise.all(
      notifications.map(async (notification) => {
        if (!notification.sender) {
          // If sender doesn't exist, return notification without sender data
          return {
            ...notification.toObject(),
            sender: null
          };
        }
        
        const senderProfile = await Profile.findOne({ user: notification.sender._id });
        return {
          ...notification.toObject(),
          sender: {
            ...notification.sender.toObject(),
            profilePicture: senderProfile?.profilePicture || null
          }
        };
      })
    );

    res.json(notificationsWithProfiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
// @access  Private
router.get("/unread-count", auth, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT /api/notifications/mark-read
// @desc    Mark notifications as read
// @access  Private
router.put("/mark-read", auth, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ msg: "Invalid notification IDs" });
    }

    await Notification.markAsRead(notificationIds, req.user.id);
    res.json({ msg: "Notifications marked as read" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put("/mark-all-read", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { 
        $set: { 
          isRead: true, 
          readAt: new Date() 
        } 
      }
    );
    
    res.json({ msg: "All notifications marked as read" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    // Make sure user owns notification
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await Notification.findByIdAndRemove(req.params.id);
    res.json({ msg: "Notification removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid notification ID" });
    }
    res.status(500).send("Server error");
  }
});

// @route   DELETE /api/notifications
// @desc    Delete all notifications for user
// @access  Private
router.delete("/", auth, async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user.id });
    res.json({ msg: "All notifications removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
