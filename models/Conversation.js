const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
	participants: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	],
	lastMessage: {
		type: String,
	},
	lastMessageAt: {
		type: Date,
		default: Date.now,
	},
});

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model("Conversation", ConversationSchema);


