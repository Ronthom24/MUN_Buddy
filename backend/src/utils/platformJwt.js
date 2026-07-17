const jwt = require("jsonwebtoken");

/**
 * Platform admin tokens are signed with their own secret, deliberately
 * separate from utils/jwt.js's organizer/delegate realm -- this is the
 * "dedicated authentication system" the Platform Administration spec (ch.4)
 * requires, not a role field on the shared token.
 */
function signToken(payload) {
    return jwt.sign(payload, process.env.PLATFORM_JWT_SECRET, {
        expiresIn: process.env.PLATFORM_JWT_EXPIRES_IN || "1d"
    });
}

function verifyToken(token) {
    return jwt.verify(token, process.env.PLATFORM_JWT_SECRET);
}

module.exports = { signToken, verifyToken };
