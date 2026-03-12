const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("Team", teamSchema);