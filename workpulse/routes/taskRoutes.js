const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  createTask,
  getTasks,
  updateStatus
} = require("../controllers/taskController");

router.post("/create", auth, createTask);

router.get("/all", auth, getTasks);

router.patch("/status/:id", auth, updateStatus);

module.exports = router;