const rateLimit = require("express-rate-limit");

// Spec 22.13: general API abuse protection.
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please slow down and try again shortly." }
});

// Stricter limiter for auth endpoints (login attempts, registration,
// password reset) -- the specific abuse surfaces spec 22.13 calls out.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts. Please wait a few minutes before trying again." }
});

module.exports = { generalLimiter, authLimiter };
