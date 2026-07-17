const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads");

const driver = process.env.STORAGE_DRIVER === "s3" ? "s3" : "local";

let s3Client = null;
function getS3Client() {
    if (s3Client) return s3Client;
    const { S3Client } = require("@aws-sdk/client-s3");
    s3Client = new S3Client({
        region: process.env.S3_REGION || "auto",
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
        }
    });
    return s3Client;
}

// Local disk: multer's diskStorage already wrote the file, so persist() is a
// no-op there. S3 driver uses multer's memoryStorage instead (see
// middleware/upload.js), so persist() does the actual upload here.
async function persist(file) {
    if (driver !== "s3") return;

    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    await getS3Client().send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: file.filename,
        Body: file.buffer,
        ContentType: file.mimetype
    }));
}

function resolveFileUrl(filename) {
    if (driver !== "s3") return `/uploads/${filename}`;

    if (process.env.S3_PUBLIC_URL_BASE) {
        return `${process.env.S3_PUBLIC_URL_BASE.replace(/\/$/, "")}/${filename}`;
    }
    return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${filename}`;
}

if (driver === "local" && !fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

module.exports = { driver, persist, resolveFileUrl, uploadDir };
