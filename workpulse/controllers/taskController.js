const Task = require("../models/Task");

exports.createTask = async (req, res) => {

  try {

    const { title, description, teamId, assignedTo } = req.body;

    const task = await Task.create({
      title,
      description,
      teamId,
      assignedTo,
      companyId: req.user.companyId
    });

    res.json(task);

  } catch (error) {

    res.status(500).json({ message: error.message });

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

    const { status } = req.body;

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId
      },
      { status },
      { new: true }
    );

    res.json(task);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};