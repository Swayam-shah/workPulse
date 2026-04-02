const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    action: {
        type: String,
        required: true
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    },
    project: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Project",
  required: false
},
    details: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model("Activity", activitySchema);