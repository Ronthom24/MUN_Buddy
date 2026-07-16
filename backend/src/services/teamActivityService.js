const teamActivityModel = require("../models/teamActivityModel");

/**
 * Lightweight, team-visible activity feed (spec 16.11). This is
 * intentionally not the full compliance audit log (spec 16.12/22.16),
 * which lands in Phase 8 with before/after value diffs across every model.
 */
async function log(conferenceId, user, action) {
    await teamActivityModel.create({
        conferenceId,
        actorEmail: user.email,
        actorName: user.fullName || null,
        action
    });
}

module.exports = { log };
