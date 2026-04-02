const Task = require("../models/Task");
const Team = require("../models/Team");

exports.getStats = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // User-scoped stats: only teams this user is a member of.
    const userTeams = await Team.find({
      company: companyId,
      members: req.user._id
    }).select("_id name");
    const teamIds = userTeams.map((t) => t._id);

    const totalTeams = userTeams.length;

    const tasks = await Task.find({ team: { $in: teamIds } }).populate("team", "name");
    const now = new Date();

    const teamStatsMap = {};

    userTeams.forEach((team) => {
      teamStatsMap[String(team._id)] = {
        teamId: team._id,
        teamName: team.name || "Unnamed Team",
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        failedTasks: 0,
        tasks: {
          todo: [],
          inProgress: [],
          completed: [],
          failed: []
        }
      };
    });

    for (const task of tasks) {
      const key = String(task.team?._id || task.team);
      if (!teamStatsMap[key]) continue;

      const stat = teamStatsMap[key];
      stat.totalTasks += 1;

      const isFailedByDeadline =
        task.deadline &&
        task.deadline < now &&
        (task.percentage ?? 0) < 100;

      const effectiveStatus = isFailedByDeadline ? "failed" : task.status;

      const title = task.title || "(Untitled task)";
      if (effectiveStatus === "completed") {
        stat.completedTasks += 1;
        stat.tasks.completed.push(title);
      } else if (effectiveStatus === "in-progress") {
        stat.inProgressTasks += 1;
        stat.tasks.inProgress.push(title);
      } else if (effectiveStatus === "failed") {
        stat.failedTasks += 1;
        stat.tasks.failed.push(title);
      } else {
        stat.todoTasks += 1;
        stat.tasks.todo.push(title);
      }
    }

    const teams = Object.values(teamStatsMap);
    const totalTasks = teams.reduce((sum, t) => sum + t.totalTasks, 0);
    const completedTasks = teams.reduce((sum, t) => sum + t.completedTasks, 0);
    const inProgressTasks = teams.reduce((sum, t) => sum + t.inProgressTasks, 0);
    const failedTasks = teams.reduce((sum, t) => sum + t.failedTasks, 0);

    res.json({
      totalTeams,
      totalTasks,
      completedTasks,
      inProgressTasks,
      failedTasks,
      teams
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
