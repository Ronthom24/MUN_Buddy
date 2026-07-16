const auditLogModel = require("../models/auditLogModel");

/**
 * Full compliance audit log (spec 22.16): immutable, with before/after
 * values, distinct from the human-readable team_activity feed (Phase 7).
 * `user` may be an organizer's req.user ({ email, fullName }) or omitted for
 * system-initiated actions (e.g. scheduled-announcement auto-publish).
 */
async function log({ conferenceId, user, actorType, action, resourceType, resourceId, previousValue, newValue }) {
    await auditLogModel.create({
        conferenceId,
        actorType: actorType || (user ? "organizer" : "system"),
        actorEmail: user?.email || null,
        actorName: user?.fullName || null,
        action,
        resourceType,
        resourceId,
        previousValue,
        newValue
    });
}

async function listForConference(conferenceId, options) {
    return auditLogModel.listByConference(conferenceId, options);
}

module.exports = { log, listForConference };
