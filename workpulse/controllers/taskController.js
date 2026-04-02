const Task = require("../models/Task");
const Activity = require("../models/activity");

exports.createTask = async (req, res) => {

  try {

    const task = await Task.create({
      ...req.body,
      companyId: req.user.companyId
    });

    // Activity log (safe)
    try {
      await Activity.create({
        user: req.user.id || req.user._id,
        action: "TASK_CREATED",
        task: task._id,
        details: `Task ${task.title} was created`
      });
    } catch (err) {
      console.log("Activity log failed:", err.message);
    }

    res.json(task);

  } catch (err) {
    console.log("Create task error:", err);
    res.status(500).json({ error: err.message });
  }

};
exports.getTasks = async (req, res) => {
  try {

    const tasks = await Task.find({
      companyId: req.user.companyId
    })
    .populate("assignedTo", "name email")
    .populate("teamId", "name");

    res.json(tasks);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.updateStatus = async (req, res) => {

  try {

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    await Activity.create({
      user: req.user.id,
      action: "TASK_STATUS_UPDATED",
      task: task._id,
      details: `Task status changed to ${task.status}`
    });

    res.json(task);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};