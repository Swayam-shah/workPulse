const User = require("../models/User");

// ── Existing: list all company users ──────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ companyId: req.user.companyId })
      .select("name email role status createdAt");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── New: list pending employees in admin's company ─────────────────────────
exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({
      companyId: req.user.companyId,
      status: "pending",
    }).select("name email role createdAt");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── New: approve a pending employee ───────────────────────────────────────
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found in your company." });
    }

    if (user.status !== "pending") {
      return res.status(400).json({ message: "User is not in a pending state." });
    }

    user.status = "active";
    await user.save();

    res.json({ message: "Employee approved successfully.", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── New: reject a pending employee ────────────────────────────────────────
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found in your company." });
    }

    if (user.status !== "pending") {
      return res.status(400).json({ message: "User is not in a pending state." });
    }

    user.status = "rejected";
    await user.save();

    res.json({ message: "Employee registration rejected.", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};