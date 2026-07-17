const loginHistoryModel = require("../models/loginHistoryModel");
const ApiError = require("../utils/ApiError");

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

async function record({ userType, userId, email, success, ipAddress, userAgent }) {
    await loginHistoryModel.create({ userType, userId, email, success, ipAddress, userAgent });
}

async function listForUser(userType, userId, options) {
    return loginHistoryModel.listForUser(userType, userId, options);
}

/**
 * Lockout enforcement (Security Center, spec ch.22): reuses the same
 * threshold/window as the "suspicious activity" report
 * (loginHistoryModel.listSuspiciousEmails) so a flagged account is also a
 * blocked account, not just a line in a report. No separate lock/unlock
 * state to manage -- it self-clears once the window rolls past the last
 * failure, same mental model as the rate limiter.
 */
async function assertNotLocked(email) {
    const failures = await loginHistoryModel.countRecentFailures(email, { windowMinutes: LOCKOUT_WINDOW_MINUTES });
    if (failures >= LOCKOUT_THRESHOLD) {
        throw new ApiError(423, `Too many failed login attempts. Try again in a few minutes.`);
    }
}

module.exports = { record, listForUser, assertNotLocked };
