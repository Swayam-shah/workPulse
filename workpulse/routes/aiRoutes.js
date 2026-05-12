const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const aiController = require("../controllers/aiController");
const { verifyToken } = require("../middleware/authMiddleware");

const uploadsDir = path.join(__dirname, "..", "tmp_uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Supported extensions for AI summarisation
const SUPPORTED_EXTS = new Set([
    // Documents
    "pdf", "txt", "csv",
    "docx", "doc",
    "xlsx", "xls",
    "pptx", "ppt",
    // Images
    "png", "jpg", "jpeg", "gif", "webp",
    // Audio
    "mp3", "wav", "aac", "ogg", "flac", "aiff", "m4a",
    // Video
    "mp4", "webm", "mov", "avi", "mkv", "flv", "mpg", "mpeg", "3gp",
]);

// Temporary storage just for analysis
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        cb(null, `${Date.now()}-ai-${file.originalname}`);
    }
});

const fileFilter = (_req, file, cb) => {
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (SUPPORTED_EXTS.has(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`File type .${ext} is not supported for AI summarisation`), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 100 * 1024 * 1024 } }); // 100 MB

router.post("/summarize-document", verifyToken, upload.single("document"), aiController.summarizeDocument);
router.get("/employee-review/:userId", verifyToken, aiController.generateEmployeeReview);

module.exports = router;
