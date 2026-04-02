const Comment = require("../models/Comment");
const Activity = require("../models/activity");


// ADD COMMENT
exports.addComment = async (req, res) => {

    try {

        const comment = await Comment.create({
            task: req.params.taskId,
            user: req.user.id,
            text: req.body.text
        });

        // log activity
        await Activity.create({
            user: req.user.id,
            action: "COMMENT_ADDED",
            task: req.params.taskId,
            details: "A new comment was added"
        });

        res.json(comment);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }

};


// GET COMMENTS
exports.getComments = async (req, res) => {

    try {

        const comments = await Comment.find({
            task: req.params.taskId
        })
        .populate("user", "name")
        .sort({ createdAt: 1 });

        res.json(comments);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }

};