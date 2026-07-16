const asyncHandler = require("../utils/asyncHandler");
const organizerAccessModel = require("../models/organizerAccessModel");
const departmentModel = require("../models/departmentModel");
const teamActivityModel = require("../models/teamActivityModel");

const dashboard = asyncHandler(async (req, res) => {
    const [access, departments] = await Promise.all([
        organizerAccessModel.listByConference(req.conference.id),
        departmentModel.listByConference(req.conference.id)
    ]);

    // The conference owner's own organizer_access row never gets a password_hash of its
    // own (their login credential lives in the separate `organizers` table set at
    // registration) -- only invited staff rows are "claimed" via password_hash.
    const totalMembers = access.filter((a) => a.role === "owner" || a.password_hash).length;
    const pendingInvitations = access.filter((a) => a.role !== "owner" && !a.password_hash).length;
    const byRole = access.reduce((acc, a) => {
        acc[a.role] = (acc[a.role] || 0) + 1;
        return acc;
    }, {});

    const recentActivity = await teamActivityModel.listByConference(req.conference.id, 10);

    res.status(200).json({
        success: true,
        dashboard: {
            totalMembers,
            pendingInvitations,
            departmentCount: departments.length,
            byRole,
            recentActivity
        }
    });
});

const activity = asyncHandler(async (req, res) => {
    const rows = await teamActivityModel.listByConference(req.conference.id, 100);
    res.status(200).json({ success: true, activity: rows });
});

module.exports = { dashboard, activity };
