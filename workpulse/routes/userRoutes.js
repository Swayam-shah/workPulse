const express = require("express");
const router = express.Router();

const { getUsers } = require("../controllers/userController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.get("/", verifyToken, isAdmin, getUsers);

module.exports = router;