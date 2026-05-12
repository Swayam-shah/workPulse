const Message = require("../models/Message");
const User = require("../models/User");
const mongoose = require("mongoose");

// GET /api/messages/contacts  — company members to chat with
exports.getContacts = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const currentUserId = req.user._id.toString();

    const users = await User.find({
      companyId,
      _id: { $ne: req.user._id },
      status: "active",
    })
      .select("name email role")
      .lean();

    // Attach unread count per contact
    const withUnread = await Promise.all(
      users.map(async (u) => {
        const unread = await Message.countDocuments({
          companyId,
          from: u._id,
          to: req.user._id,
          read: false,
        });
        return { ...u, unreadCount: unread };
      })
    );

    return res.json(withUnread);
  } catch (err) {
    console.error("getContacts error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/messages/:userId  — conversation with a specific user
exports.getConversation = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const myId = req.user._id;
    const otherId = new mongoose.Types.ObjectId(req.params.userId);

    const messages = await Message.find({
      companyId,
      $or: [
        { from: myId, to: otherId },
        { from: otherId, to: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.json(messages);
  } catch (err) {
    console.error("getConversation error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/messages  — send a message
exports.sendMessage = async (req, res) => {
  try {
    const { toUserId, text } = req.body;
    if (!toUserId || !text?.trim()) {
      return res.status(400).json({ error: "toUserId and text are required." });
    }

    const msg = await Message.create({
      companyId: req.user.companyId,
      from: req.user._id,
      to: toUserId,
      text: text.trim(),
    });

    // Emit in real-time to recipient
    const io = req.app.locals.io;
    const payload = {
      _id: msg._id,
      from: req.user._id,
      to: toUserId,
      text: msg.text,
      createdAt: msg.createdAt,
      read: false,
      senderName: req.user.name,
    };
    io.to(`user:${toUserId}`).emit("message:new", payload);

    return res.status(201).json(payload);
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// PATCH /api/messages/read/:userId  — mark conversation as read
exports.markRead = async (req, res) => {
  try {
    await Message.updateMany(
      {
        companyId: req.user.companyId,
        from: req.params.userId,
        to: req.user._id,
        read: false,
      },
      { read: true }
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("markRead error:", err);
    return res.status(500).json({ error: err.message });
  }
};
