const Task = require("../models/Task");
const Team = require("../models/Team");

exports.getStats = async (req, res) => {
  try {

    const companyId = req.user.companyId;

    const totalTeams = await Team.countDocuments({ companyId });

    const totalTasks = await Task.countDocuments({ companyId });

    const completedTasks = await Task.countDocuments({
      companyId,
      status: "done"
    });

    const inProgressTasks = await Task.countDocuments({
      companyId,
      status: "progress"
    });

    res.json({
      totalTeams,
      totalTasks,
      completedTasks,
      inProgressTasks
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};