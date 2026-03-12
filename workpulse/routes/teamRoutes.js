const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  createTeam,
  getTeams
} = require("../controllers/teamController");

router.post("/create", auth, createTeam);

router.get("/all", auth, getTeams);

module.exports = router;