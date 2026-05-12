const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  },

  role: {
    type: String,
    default: "member"
  },

  status: {
    type: String,
    enum: ["active", "pending", "rejected"],
    default: "active"
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);