const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  // User who will receive this notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // User who triggered this notification
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Type of notification
  type: {
    type: String,
    enum: [
      "connection_request", 
      "connection_accepted", 
      "post_like", 
      "post_comment", 
      "connection_suggestion"
    ],
    required: true,
  },
  // The message/content of the notification
  message: {
    type: String,
    required: true,
  },
  // Reference to related entities (optional)
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
  relatedConnection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Connection",
  },
  relatedComment: {
    type: mongoose.Schema.Types.ObjectId,
  },
  // Whether the notification has been read
  isRead: {
    type: Boolean,
    default: false,
  },
  // When the notification was created
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // When the notification was read (optional)
  readAt: {
    type: Date,
  },
});

// Index for efficient querying
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Virtual for time ago display
NotificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return this.createdAt.toLocaleDateString();
});

// Include virtuals when converting to JSON
NotificationSchema.set('toJSON', { virtuals: true });
NotificationSchema.set('toObject', { virtuals: true });

// Static method to create notification
NotificationSchema.statics.createNotification = async function(data) {
  const { recipient, sender, type, message, relatedPost, relatedConnection, relatedComment } = data;
  
  // Don't create notification if sender and recipient are the same
  if (recipient.toString() === sender.toString()) {
    return null;
  }
  
  const notification = new this({
    recipient,
    sender,
    type,
    message,
    relatedPost,
    relatedConnection,
    relatedComment
  });
  
  return await notification.save();
};

// Static method to mark notifications as read
NotificationSchema.statics.markAsRead = async function(notificationIds, userId) {
  return await this.updateMany(
    { 
      _id: { $in: notificationIds },
      recipient: userId
    },
    { 
      $set: { 
        isRead: true, 
        readAt: new Date() 
      } 
    }
  );
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

module.exports = mongoose.model("Notification", NotificationSchema);
