const express = require("express");
const router = express.Router();

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

const {
  createTeam,
  getTeams,
  joinTeam,
  deleteTeam
} = require("../controllers/teamController");

router.post("/create", verifyToken, isAdmin, createTeam);

router.get("/all", verifyToken, getTeams);

router.post("/join", verifyToken, joinTeam);
router.delete("/delete/:id", verifyToken, isAdmin, deleteTeam);

module.exports = router;