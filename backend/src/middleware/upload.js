const path = require("path");
const multer = require("multer");
const ApiError = require("../utils/ApiError");
const storageService = require("../services/storageService");

function generateFilename(originalname) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    return `${unique}${path.extname(originalname)}`;
}

// Uploaded files on local disk don't survive a redeploy on most hosts, so
// production should set STORAGE_DRIVER=s3 (see storageService.js) and point
// it at a real bucket. Local disk stays the zero-config default for dev.
const storage = storageService.driver === "s3"
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => cb(null, storageService.uploadDir),
        filename: (req, file, cb) => cb(null, generateFilename(file.originalname))
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
    // multer.memoryStorage() (used for the s3 driver) doesn't assign
    // req.file.filename the way diskStorage does, so generate one here.
    if (storageService.driver === "s3") file.filename = generateFilename(file.originalname);
    cb(null, true);
}

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter
});

module.exports = upload;
