const express = require("express");
const router = express.Router();

const {
  getUsers,
  getPendingUsers,
  approveUser,
  rejectUser,
} = require("../controllers/userController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.get("/", verifyToken, isAdmin, getUsers);
router.get("/pending", verifyToken, isAdmin, getPendingUsers);
router.put("/:id/approve", verifyToken, isAdmin, approveUser);
router.put("/:id/reject", verifyToken, isAdmin, rejectUser);

module.exports = router;