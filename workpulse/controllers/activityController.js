const Activity = require("../models/activity");

exports.getProjectActivity = async (req, res) => {

    try {

        const activities = await Activity.find({
            project: req.params.projectId
        })
        .populate("user", "name")
        .sort({ createdAt: -1 });

        res.json(activities);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }

};