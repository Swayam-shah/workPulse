const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Task = require("../models/Task");
const { verifyToken } = require("../middleware/authMiddleware");
const Team = require("../models/Team");

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const allowedMimeTypes = new Set([
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo"
]);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        cb(null, `${Date.now()}-${safeName}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024, files: 10 },
    fileFilter: (_req, file, cb) => {
        if (allowedMimeTypes.has(file.mimetype)) return cb(null, true);
        cb(new Error("Only PDF/Excel/PPT/Video files are allowed"));
    }
});

const parseAttachments = (files = []) =>
    files.map((file) => ({
        originalName: file.originalname,
        fileName: file.filename,
        url: `/uploads/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size
    }));

const deletePhysicalFile = (fileName) => {
    if (!fileName) return;
    const p = path.join(uploadsDir, fileName);
    if (fs.existsSync(p)) {
        fs.unlinkSync(p);
    }
};


/* ---------------- CREATE TASK ---------------- */

router.post("/create", verifyToken, upload.array("attachments", 10), async (req, res) => {

    const { title, description, assignedTo, team, deadline } = req.body;

    try {

        const teamDoc = await Team.findById(team);

        if (!teamDoc) {
            return res.status(404).send("Team not found");
        }

        const uid = req.user._id.toString();
        const inTeam = (id) =>
            teamDoc.members.some((m) => m.toString() === id.toString());

        if (!inTeam(uid)) {
            return res.status(403).send("You are not part of this team");
        }

        if (!inTeam(assignedTo)) {
            return res.status(403).send("Assigned user is not in this team");
        }

        const task = await Task.create({
            title,
            description,
            assignedTo,
            assignedBy: req.user._id,
            team,
            deadline,
            attachments: parseAttachments(req.files)
        });

        res.json(task);

    } catch (err) {

        res.status(500).json(err);

    }

});


/* ---------------- UPDATE PROGRESS ---------------- */

router.put("/update-progress/:id", verifyToken, async (req,res)=>{

    try{

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).send("Task not found");
        }

        if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).send("Only assigned user can update progress");
        }

        const percent = req.body.percentage;

        if (percent < 0 || percent > 100) {
            return res.status(400).send("Percentage must be between 0 and 100");
        }

        task.percentage = percent;

        if (percent === 0) {
            task.status = "todo";
        } else if (percent === 100) {
            task.status = "completed";
        } else {
            task.status = "in-progress";
        }

        await task.save();

        res.json(task);

    }
    catch(err){
        res.status(500).json(err);
    }

});


/* ---------------- GET TASKS + DEADLINE CHECK ---------------- */

router.get("/all", verifyToken, async (req,res)=>{

    try{

        const teams = await Team.find({
            company: req.user.companyId,
            members: req.user._id
        });

        const teamIds = teams.map(t => t._id);

        const tasks = await Task.find({
            team: { $in: teamIds }
        })
        .populate("assignedTo assignedBy team");

        const now = new Date();

        for(let task of tasks){

            if(task.deadline && task.deadline < now && task.percentage < 100){

                task.status = "failed";
                await task.save();

            }

        }

        res.json(tasks);

    }
    catch(err){

        res.status(500).json(err);

    }

});


/* ---------------- ADD COMMENT ---------------- */

router.post("/comment/:id", verifyToken, async (req,res)=>{

    try{

        const task = await Task.findById(req.params.id).populate("team");

        if(!task){
            return res.status(404).send("Task not found");
        }

        const inTeam = task.team.members.some(
            (m) => m.toString() === req.user._id.toString()
        );
        if (!inTeam) {
            return res.status(403).send("You are not in this team");
        }

        task.comments.push({
            text:req.body.text,
            user:req.user._id
        });

        await task.save();

        res.json(task);

    }
    catch(err){

        res.status(500).json(err);

    }

});

/* ---------------- ADMIN: EDIT TASK ---------------- */

router.put("/edit/:id", verifyToken, upload.array("attachments", 10), async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate("team");
        if (!task) {
            return res.status(404).send("Task not found");
        }

        const canManageTask =
            req.user.role === "admin" ||
            String(task.assignedBy) === String(req.user._id);
        if (!canManageTask) {
            return res.status(403).send("Only admins or task assigner can edit tasks");
        }

        if (!task.team || String(task.team.company) !== String(req.user.companyId)) {
            return res.status(403).send("Task does not belong to your company");
        }

        const nextTeamId = req.body.team || task.team._id;
        const nextTeam = await Team.findById(nextTeamId);
        if (!nextTeam || String(nextTeam.company) !== String(req.user.companyId)) {
            return res.status(400).send("Invalid team");
        }

        const nextAssignedTo = req.body.assignedTo || task.assignedTo;
        const inTeam = nextTeam.members.some((m) => String(m) === String(nextAssignedTo));
        if (!inTeam) {
            return res.status(400).send("Assigned user must belong to selected team");
        }

        if (typeof req.body.title === "string") task.title = req.body.title;
        if (typeof req.body.description === "string") task.description = req.body.description;
        if (req.body.deadline === null || req.body.deadline === "") task.deadline = undefined;
        else if (req.body.deadline) task.deadline = req.body.deadline;

        let removedAttachments = [];
        if (req.body.removedAttachments) {
            try {
                const parsed = JSON.parse(req.body.removedAttachments);
                if (Array.isArray(parsed)) {
                    removedAttachments = parsed.map(String);
                }
            } catch (_err) {
                // Ignore malformed removedAttachments payload.
            }
        }

        if (!Array.isArray(task.attachments)) {
            task.attachments = [];
        }
        if (removedAttachments.length > 0) {
            const toDelete = task.attachments.filter((a) =>
                removedAttachments.includes(String(a._id))
            );
            toDelete.forEach((a) => deletePhysicalFile(a.fileName));
            task.attachments = task.attachments.filter(
                (a) => !removedAttachments.includes(String(a._id))
            );
        }
        task.attachments.push(...parseAttachments(req.files));

        task.team = nextTeamId;
        task.assignedTo = nextAssignedTo;

        const updated = await task.save();
        const populated = await Task.findById(updated._id).populate("assignedTo assignedBy team");
        res.json(populated);
    } catch (err) {
        res.status(500).json(err);
    }
});

/* ---------------- ADMIN: DELETE TASK ---------------- */

router.delete("/delete/:id", verifyToken, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate("team");
        if (!task) {
            return res.status(404).send("Task not found");
        }

        const canManageTask =
            req.user.role === "admin" ||
            String(task.assignedBy) === String(req.user._id);
        if (!canManageTask) {
            return res.status(403).send("Only admins or task assigner can delete tasks");
        }

        if (!task.team || String(task.team.company) !== String(req.user.companyId)) {
            return res.status(403).send("Task does not belong to your company");
        }

        (task.attachments || []).forEach((a) => deletePhysicalFile(a.fileName));
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: "Task deleted" });
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;