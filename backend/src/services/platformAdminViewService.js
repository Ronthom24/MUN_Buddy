const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const conferenceModel = require("../models/conferenceModel");
const auditLogModel = require("../models/auditLogModel");

const ADMIN_VIEW_EXPIRES_IN = "2h";

/**
 * Mints a short-lived, conference-scoped token in the NORMAL organizer JWT
 * realm (signed with the existing JWT_SECRET, not PLATFORM_JWT_SECRET) so
 * the platform admin can reuse the existing Organizer Workspace UI without
 * logging in "as" a specific organizer's identity (spec ch.9). The
 * conferenceId claim is what makes this unbypassable when combined with the
 * resolveConferenceAccess() check in middleware/auth.js -- see that file's
 * adminView branch for the other half of this bridge.
 */
async function mintAdminViewToken(admin, conferenceId) {
    const conference = await conferenceModel.findById(conferenceId);
    if (!conference) throw new ApiError(404, "Conference not found");

    await auditLogModel.create({
        conferenceId: conference.id,
        actorType: "platform_admin",
        actorEmail: admin.email,
        actorName: admin.name,
        action: "admin_view_conference",
        resourceType: "conference",
        resourceId: conference.id
    });

    const token = jwt.sign(
        { id: null, role: "organizer", email: admin.email, adminView: true, conferenceId: conference.id },
        process.env.JWT_SECRET,
        { expiresIn: ADMIN_VIEW_EXPIRES_IN }
    );

    return { token, conference };
}

module.exports = { mintAdminViewToken };
