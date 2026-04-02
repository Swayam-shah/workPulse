const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");

const {
    addComment,
    getComments
} = require("../controllers/commentController");


router.post("/:taskId", verifyToken, addComment);

router.get("/:taskId", verifyToken, getComments);

module.exports = router;