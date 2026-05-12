const express = require("express");
const router = express.Router();
const { startMeeting, endMeeting, getActiveMeeting } = require("../controllers/meetController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// GET  /api/meet/active    — any authenticated user
router.get("/active", verifyToken, getActiveMeeting);

// POST /api/meet/start     — admin only
router.post("/start", verifyToken, isAdmin, startMeeting);

// POST /api/meet/end       — admin only
router.post("/end", verifyToken, isAdmin, endMeeting);

module.exports = router;
