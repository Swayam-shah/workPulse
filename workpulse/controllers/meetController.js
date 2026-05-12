const Meeting = require("../models/Meeting");
const User = require("../models/User");

// POST /api/meet/start  (admin only)
exports.startMeeting = async (req, res) => {
  try {
    const { roomUrl, title } = req.body;
    if (!roomUrl) return res.status(400).json({ error: "roomUrl is required." });

    const companyId = req.user.companyId;

    // End any previously active meeting
    await Meeting.updateMany(
      { companyId, status: "active" },
      { status: "ended" }
    );

    const meeting = await Meeting.create({
      companyId,
      roomUrl,
      title: title || "Team Meeting",
      startedBy: req.user._id,
      status: "active",
    });

    // Populate starter name for the notification payload
    const starter = await User.findById(req.user._id).select("name");

    const payload = {
      meetingId: meeting._id,
      roomUrl: meeting.roomUrl,
      title: meeting.title,
      startedBy: starter?.name || "Admin",
      companyId: companyId.toString(),
    };

    // Emit to all sockets in this company's room
    const io = req.app.locals.io;
    io.to(`company:${companyId}`).emit("meet:started", payload);

    return res.status(201).json({ meeting: payload });
  } catch (err) {
    console.error("startMeeting error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/meet/end  (admin only)
exports.endMeeting = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    await Meeting.updateMany({ companyId, status: "active" }, { status: "ended" });

    const io = req.app.locals.io;
    io.to(`company:${companyId}`).emit("meet:ended", {
      companyId: companyId.toString(),
    });

    return res.json({ message: "Meeting ended." });
  } catch (err) {
    console.error("endMeeting error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/meet/active
exports.getActiveMeeting = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const meeting = await Meeting.findOne({ companyId, status: "active" })
      .populate("startedBy", "name")
      .lean();

    if (!meeting) return res.json({ meeting: null });

    return res.json({
      meeting: {
        meetingId: meeting._id,
        roomUrl: meeting.roomUrl,
        title: meeting.title,
        startedBy: meeting.startedBy?.name || "Admin",
        companyId: companyId.toString(),
      },
    });
  } catch (err) {
    console.error("getActiveMeeting error:", err);
    return res.status(500).json({ error: err.message });
  }
};
