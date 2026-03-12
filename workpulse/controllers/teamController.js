const Team = require("../models/Team");

exports.createTeam = async (req, res) => {
  try {

    const { name } = req.body;

    const team = await Team.create({
      name,
      companyId: req.user.companyId
    });

    res.json(team);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getTeams = async (req, res) => {
  try {

    const teams = await Team.find({
      companyId: req.user.companyId
    }).populate("members", "name email");

    res.json(teams);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};