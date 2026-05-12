const { GoogleGenAI } = require("@google/genai");
const fs   = require("fs");
const path = require("path");
const Task = require("../models/Task");
const User = require("../models/User");

const MODEL = "gemini-2.5-flash";

/* ─── MIME helpers ──────────────────────────────────────────────────────── */

const AUDIO_EXTS = new Set(["mp3", "wav", "aiff", "aac", "ogg", "flac", "m4a"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "avi", "mkv", "flv", "mpg", "mpeg", "3gp"]);

const EXT_MIME = {
    mp3: "audio/mpeg", wav: "audio/wav", aac: "audio/aac",
    ogg: "audio/ogg", flac: "audio/flac", aiff: "audio/aiff", m4a: "audio/mp4",
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
    avi: "video/avi", mkv: "video/x-matroska", flv: "video/x-flv",
    mpg: "video/mpeg", mpeg: "video/mpeg", "3gp": "video/3gpp",
    pdf: "application/pdf",
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    gif: "image/gif", webp: "image/webp",
};

/* ─── text-extraction helpers (pure-JS, no LibreOffice needed) ─────────── */

/** Extract text from XLSX / XLS / CSV */
async function extractExcelText(filePath, ext) {
    const XLSX = require("xlsx");
    const workbook = XLSX.readFile(filePath);
    const lines = [];
    for (const sheetName of workbook.SheetNames) {
        lines.push(`\n=== Sheet: ${sheetName} ===`);
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
        lines.push(csv);
    }
    return lines.join("\n");
}

/** Extract text from DOCX (and partial .doc support via mammoth) */
async function extractDocxText(filePath) {
    const mammoth = require("mammoth");
    const buffer  = fs.readFileSync(filePath);
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
}

/** Extract text from PPTX by reading slide XML inside the ZIP */
async function extractPptxText(filePath) {
    const JSZip = require("jszip");
    const buffer = fs.readFileSync(filePath);
    const zip    = await JSZip.loadAsync(buffer);

    const slideFiles = Object.keys(zip.files)
        .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
        .sort((a, b) => {
            const n = s => parseInt(s.match(/\d+/)?.[0] || "0", 10);
            return n(a) - n(b);
        });

    const lines = [];
    for (const slideName of slideFiles) {
        const xml  = await zip.files[slideName].async("string");
        const text = xml
            .replace(/<a:t>([^<]*)<\/a:t>/g, "$1 ")
            .replace(/<[^>]+>/g, " ")
            .replace(/&amp;/g, "&").replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">").replace(/&apos;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/\s{2,}/g, " ")
            .trim();
        if (text) lines.push(`[Slide ${slideFiles.indexOf(slideName) + 1}] ${text}`);
    }
    return lines.join("\n");
}

/** Extract plain text from a text-based file (CSV, TXT, etc.) */
function extractPlainText(filePath) {
    return fs.readFileSync(filePath, "utf-8");
}

/* ─── Map extension → extractor ────────────────────────────────────────── */
async function extractTextFromFile(filePath, ext) {
    switch (ext) {
        case "xlsx":
        case "xls":
            return await extractExcelText(filePath, ext);
        case "docx":
        case "doc":
            return await extractDocxText(filePath);   // mammoth handles both
        case "pptx":
            return await extractPptxText(filePath);
        case "csv":
        case "txt":
            return extractPlainText(filePath);
        default:
            return null;
    }
}

/* ─── Build Gemini parts for a file ─────────────────────────────────────── */
async function buildParts(filePath, mimeType, ext, systemPrompt) {
    // ── Images / PDFs → native Gemini vision ────────────────────────────
    if (
        mimeType === "application/pdf" ||
        mimeType.startsWith("image/") ||
        mimeType.startsWith("text/plain")
    ) {
        const data = fs.readFileSync(filePath).toString("base64");
        return [
            { inlineData: { data, mimeType } },
            { text: systemPrompt },
        ];
    }

    // ── Audio → Gemini native audio understanding ────────────────────────
    if (AUDIO_EXTS.has(ext)) {
        const resolvedMime = EXT_MIME[ext] || "audio/mpeg";
        const data = fs.readFileSync(filePath).toString("base64");
        return [
            { inlineData: { data, mimeType: resolvedMime } },
            { text: "Please transcribe and summarize the key points from this audio file. " + systemPrompt },
        ];
    }

    // ── Video → Gemini native video understanding ─────────────────────────
    if (VIDEO_EXTS.has(ext)) {
        const resolvedMime = EXT_MIME[ext] || "video/mp4";
        const data = fs.readFileSync(filePath).toString("base64");
        return [
            { inlineData: { data, mimeType: resolvedMime } },
            { text: "Please describe and summarize the key content from this video file. " + systemPrompt },
        ];
    }

    // ── Office / spreadsheet / text → extract text, then prompt ────────────
    const extractedText = await extractTextFromFile(filePath, ext);

    if (!extractedText || extractedText.trim() === "") {
        return null; // signal failure
    }

    const fullPrompt =
        `${systemPrompt}\n\nDocument Content (${ext.toUpperCase()}):\n` +
        extractedText.substring(0, 30000);

    return [{ text: fullPrompt }];
}

/* ─── summarizeDocument ─────────────────────────────────────────────────── */
exports.summarizeDocument = async (req, res) => {
    const filePath = req.file?.path;
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No document provided" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "AI service is not configured (missing API key)" });
        }

        const ai    = new GoogleGenAI({ apiKey });
        const mType = req.file.mimetype;
        const ext   = req.file.originalname.split(".").pop().toLowerCase();

        const systemPrompt =
            "Please summarize the following document and provide a clear interpretation. " +
            "If this document mentions any employee reviews or performance details, please " +
            "highlight them specifically. Format your response with clear sections and bullet points.";

        const parts = await buildParts(filePath, mType, ext, systemPrompt);

        if (!parts) {
            return res.status(400).json({
                error: `Could not extract content from this ${ext.toUpperCase()} file. ` +
                       "The file may be empty, password-protected, or in an unsupported format.",
            });
        }

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [{ role: "user", parts }],
        });

        res.json({ summary: response.text });

    } catch (error) {
        console.error("AI Summarize error:", error);
        const msg = error.message || "";
        if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
            return res.status(429).json({ error: "AI quota exceeded. Please try again later." });
        }
        res.status(500).json({ error: "Failed to summarize document", details: error.message });
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (_) {}
        }
    }
};

/* ─── generateEmployeeReview ────────────────────────────────────────────── */
exports.generateEmployeeReview = async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "AI service is not configured (missing API key)" });
        }

        const ai = new GoogleGenAI({ apiKey });

        const userId = req.params.userId;
        const user   = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const tasks = await Task.find({ assignedTo: userId }).populate("team");

        const completedTasks  = tasks.filter(t => t.status === "completed").length;
        const failedTasks     = tasks.filter(t => t.status === "failed").length;
        const inProgressTasks = tasks.filter(t => t.status === "in-progress").length;
        const todoTasks       = tasks.filter(t => t.status === "todo").length;

        let taskDetails = tasks
            .map(t => `- [${t.status.toUpperCase()}] ${t.title} — ${t.percentage}% complete`)
            .join("\n");
        if (!taskDetails) taskDetails = "No tasks assigned yet.";

        const prompt =
            `You are an expert HR Manager. Generate a detailed and professional performance review for the employee: ` +
            `"${user.name} (${user.email})"\n\n` +
            `Task summary:\n` +
            `- Completed: ${completedTasks}\n` +
            `- Failed (missed deadline): ${failedTasks}\n` +
            `- In Progress: ${inProgressTasks}\n` +
            `- To-Do: ${todoTasks}\n\n` +
            `Task details:\n${taskDetails}\n\n` +
            `Provide a comprehensive performance review. Mention task completion rates specifically. ` +
            `Highlight strengths and give constructive feedback on areas of improvement. ` +
            `Format in Markdown with clear sections.`;

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        res.json({ review: response.text });

    } catch (error) {
        console.error("AI Review error:", error);
        const msg = error.message || "";
        if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
            return res.status(429).json({ error: "AI quota exceeded. Please try again later." });
        }
        res.status(500).json({ error: "Failed to generate employee review", details: error.message });
    }
};
