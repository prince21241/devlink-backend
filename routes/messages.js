const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const Profile = require("../models/Profile");

// Get user's conversations
router.get("/conversations", auth, async (req, res) => {
	try {
		const conversations = await Conversation.find({
			participants: req.user.id,
		})
			.sort({ lastMessageAt: -1 })
			.lean();

		// Attach the other user info for each conversation
		const enriched = await Promise.all(
			conversations.map(async (conv) => {
				const otherUserId = conv.participants.find(
					(pid) => pid.toString() !== req.user.id
				);
				const otherUser = await User.findById(otherUserId).select("name email").lean();
				const profile = await Profile.findOne({ user: otherUserId }).lean();
				return {
					...conv,
					otherUser: {
						_id: otherUser?._id,
						name: otherUser?.name,
						email: otherUser?.email,
						profilePicture: profile?.profilePicture || null,
					},
				};
			})
		);

		res.json(enriched);
	} catch (err) {
		console.error(err);
		res.status(500).send("Server error");
	}
});

// Create/get a conversation with a user
router.post("/conversations", auth, async (req, res) => {
	try {
		const { userId } = req.body;
		if (!userId) return res.status(400).json({ msg: "userId is required" });
		if (userId === req.user.id) return res.status(400).json({ msg: "Cannot message yourself" });

		let conversation = await Conversation.findOne({
			participants: { $all: [req.user.id, userId] },
		});

		if (!conversation) {
			conversation = await Conversation.create({
				participants: [req.user.id, userId],
				lastMessageAt: new Date(),
			});
		}

		res.json(conversation);
	} catch (err) {
		console.error(err);
		res.status(500).send("Server error");
	}
});

// Get messages in a conversation
router.get("/conversations/:id/messages", auth, async (req, res) => {
	try {
		const conv = await Conversation.findById(req.params.id);
		if (!conv) return res.status(404).json({ msg: "Conversation not found" });
		if (!conv.participants.map((p) => p.toString()).includes(req.user.id)) {
			return res.status(403).json({ msg: "Not authorized" });
		}

		const { limit = 50, before } = req.query;
		const query = { conversation: req.params.id };
		if (before) query.createdAt = { $lt: new Date(before) };

		const msgs = await Message.find(query)
			.sort({ createdAt: -1 })
			.limit(parseInt(limit))
			.lean();

		res.json(msgs.reverse());
	} catch (err) {
		console.error(err);
		res.status(500).send("Server error");
	}
});

// Send a message to a user (creates conversation if needed)
router.post("/messages", auth, async (req, res) => {
	try {
		const { recipientId, text } = req.body;
		if (!recipientId || !text || !text.trim()) {
			return res.status(400).json({ msg: "recipientId and text are required" });
		}
		if (recipientId === req.user.id) return res.status(400).json({ msg: "Cannot message yourself" });

		let conversation = await Conversation.findOne({
			participants: { $all: [req.user.id, recipientId] },
		});
		if (!conversation) {
			conversation = await Conversation.create({
				participants: [req.user.id, recipientId],
				lastMessageAt: new Date(),
			});
		}

		const message = await Message.create({
			conversation: conversation._id,
			sender: req.user.id,
			recipient: recipientId,
			text: text.trim(),
		});

		conversation.lastMessage = message.text;
		conversation.lastMessageAt = message.createdAt;
		await conversation.save();

		res.status(201).json(message);
	} catch (err) {
		console.error(err);
		res.status(500).send("Server error");
	}
});

module.exports = router;


