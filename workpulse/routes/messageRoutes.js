const express = require("express");
const router = express.Router();
const {
  getContacts,
  getConversation,
  sendMessage,
  markRead,
} = require("../controllers/messageController");
const { verifyToken } = require("../middleware/authMiddleware");

// All routes protected
router.use(verifyToken);

// GET  /api/messages/contacts        — list company members
router.get("/contacts", getContacts);

// GET  /api/messages/:userId         — conversation with a user
router.get("/:userId", getConversation);

// POST /api/messages                 — send a message
router.post("/", sendMessage);

// PATCH /api/messages/read/:userId   — mark conversation as read
router.patch("/read/:userId", markRead);

module.exports = router;
