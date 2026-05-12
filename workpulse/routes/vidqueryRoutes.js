const express = require("express");
const router = express.Router();
const { ask } = require("../controllers/vidqueryController");
const { verifyToken } = require("../middleware/authMiddleware");

// POST /api/vidquery/ask
router.post("/ask", verifyToken, ask);

module.exports = router;
