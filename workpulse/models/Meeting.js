const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    title: {
      type: String,
      default: "Team Meeting",
    },
    roomUrl: {
      type: String,
      required: true,
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);
