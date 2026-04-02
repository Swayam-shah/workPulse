const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { getProjectActivity } = require("../controllers/activityController");

router.get("/:projectId", verifyToken, getProjectActivity);

module.exports = router;