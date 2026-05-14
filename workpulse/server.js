require("dotenv").config(); // ← MUST be first, before any other require reads process.env

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const teamRoutes = require("./routes/teamRoutes");
const taskRoutes = require("./routes/taskRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const companyRoutes = require("./routes/companyRoutes");
const activityRoutes = require("./routes/activityRoutes");
const commentRoutes = require("./routes/commentRoutes");
const aiRoutes = require("./routes/aiRoutes");
const vidqueryRoutes = require("./routes/vidqueryRoutes");
const meetRoutes = require("./routes/meetRoutes");
const messageRoutes = require("./routes/messageRoutes");
connectDB();

const app = express();
const httpServer = http.createServer(app);

// ── Socket.io setup ────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// Make io available in controllers via req.app.locals.io
app.locals.io = io;

io.on("connection", (socket) => {
  // Client sends { userId, companyId } after connecting
  socket.on("join", ({ userId, companyId }) => {
    if (userId) socket.join(`user:${userId}`);
    if (companyId) socket.join(`company:${companyId}`);
  });

  socket.on("disconnect", () => {
    // Rooms are cleaned automatically
  });
});

// ── Express middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) => res.send("WorkPulse API Running"));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/vidquery", vidqueryRoutes);
app.use("/api/meet", meetRoutes);
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`WorkPulse server running on port ${PORT}`);
});