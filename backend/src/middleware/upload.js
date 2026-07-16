const path = require("path");
const fs = require("fs");
const multer = require("multer");
const ApiError = require("../utils/ApiError");

const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    }
});

// Spec 22.15 (File Security): reject dangerous/executable extensions and
// only accept the document/media types resources are actually meant to
// carry. Extension is checked (not just MIME type) since a browser-supplied
// Content-Type is trivially spoofable.
const ALLOWED_EXTENSIONS = new Set([
    ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt", ".csv",
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".zip"
]);

function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        return cb(new ApiError(400, `File type "${ext || "unknown"}" is not allowed`));
    }
    cb(null, true);
}

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter
});

module.exports = upload;
