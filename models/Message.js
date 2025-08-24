const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
	conversation: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Conversation",
		required: true,
	},
	sender: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	recipient: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	text: {
		type: String,
		required: true,
		trim: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	isRead: {
		type: Boolean,
		default: false,
	},
});

MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model("Message", MessageSchema);


