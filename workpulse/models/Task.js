const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({

    title: String,

    description: String,

    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team"
    },

    percentage: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ["todo", "in-progress", "completed", "failed"],
        default: "todo"
    },

    deadline: {
        type: Date
    },

    attachments: [
        {
            originalName: String,
            fileName: String,
            url: String,
            mimeType: String,
            size: Number,
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    comments: [
        {
            text: String,
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ]

});

module.exports = mongoose.model("Task", taskSchema);