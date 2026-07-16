const crypto = require("crypto");
const QRCode = require("qrcode");

function generateToken() {
    return crypto.randomBytes(24).toString("hex");
}

async function tokenToDataUrl(token) {
    return QRCode.toDataURL(token, { errorCorrectionLevel: "M", margin: 2, width: 320 });
}

module.exports = { generateToken, tokenToDataUrl };
