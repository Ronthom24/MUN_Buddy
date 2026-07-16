const crypto = require("crypto");
const { slugify } = require("./conferenceCode");

function generateCertificateNumber(conference) {
    const base = slugify(conference.acronym || conference.name).slice(0, 8) || "CERT";
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `MB-${base}-${random}`;
}

module.exports = { generateCertificateNumber };
