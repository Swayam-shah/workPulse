const crypto = require("crypto");
const Team = require("../models/Team");
const Task = require("../models/Task");

function generateJoinCode() {
  return crypto.randomBytes(4).toString("hex");
}

exports.createTeam = async (req, res) => {
  try {
    const { name } = req.body;

    let joinCode = generateJoinCode();
    for (let i = 0; i < 5; i++) {
      const exists = await Team.findOne({ joinCode });
      if (!exists) break;
      joinCode = generateJoinCode();
    }

    const team = await Team.create({
      name,
      company: req.user.companyId,
      members: [req.user._id],
      joinCode
    });

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      company: req.user.companyId,
      members: req.user._id
    }).populate("members", "name email");

    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.joinTeam = async (req, res) => {
  try {
    const { joinCode } = req.body;

    if (!joinCode || !String(joinCode).trim()) {
      return res.status(400).json({ message: "Team code is required" });
    }

    const team = await Team.findOne({
      joinCode: String(joinCode).trim()
    });

    if (!team) {
      return res.status(404).json({ message: "Invalid team code" });
    }

    if (team.company.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ message: "This team belongs to another company" });
    }

    const uid = req.user._id.toString();
    if (team.members.some((m) => m.toString() === uid)) {
      return res.json(team);
    }

    team.members.push(req.user._id);
    await team.save();

    const populated = await Team.findById(team._id).populate("members", "name email");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (String(team.company) !== String(req.user.companyId)) {
      return res.status(403).json({ message: "Team does not belong to your company" });
    }

    await Task.deleteMany({ team: team._id });
    await Team.findByIdAndDelete(team._id);

    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
