const asyncHandler = require("../utils/asyncHandler");
const notificationModel = require("../models/notificationModel");
const organizerAccessModel = require("../models/organizerAccessModel");

/**
 * Notifications are recipient-scoped by (recipientType, recipientId). For
 * delegates, recipientId is delegates.id (== req.user.id, rebound by
 * requireRole("delegate") to the caller's resolved delegate row -- see
 * middleware/auth.js). For organizers, recipientId is the caller's
 * organizer_access.id for the conference they're currently viewing
 * notifications from -- since one profile can hold several organizer_access
 * rows across conferences, "my notifications" for an organizer means every
 * organizer_access row that belongs to their profile.
 */
async function resolveRecipient(req) {
    if (req.user.role === "delegate") {
        return { recipientType: "delegate", recipientIds: [req.user.id] };
    }
    const rows = await organizerAccessModel.listByProfile(req.user.profileId || req.user.id);
    return { recipientType: "organizer", recipientIds: rows.map((r) => r.id) };
}

const myNotifications = asyncHandler(async (req, res) => {
    const { recipientType, recipientIds } = await resolveRecipient(req);
    const lists = await Promise.all(
        recipientIds.map((id) => notificationModel.listForRecipient(recipientType, id, { unreadOnly: req.query.unread === "true" }))
    );
    const notifications = lists.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.status(200).json({ success: true, notifications });
});

const myUnreadCount = asyncHandler(async (req, res) => {
    const { recipientType, recipientIds } = await resolveRecipient(req);
    const counts = await Promise.all(recipientIds.map((id) => notificationModel.countUnread(recipientType, id)));
    const count = counts.reduce((sum, c) => sum + Number(c), 0);
    res.status(200).json({ success: true, count });
});

const markRead = asyncHandler(async (req, res) => {
    await notificationModel.markRead(req.params.id);
    res.status(200).json({ success: true });
});

const markAllRead = asyncHandler(async (req, res) => {
    const { recipientType, recipientIds } = await resolveRecipient(req);
    await Promise.all(recipientIds.map((id) => notificationModel.markAllRead(recipientType, id)));
    res.status(200).json({ success: true });
});

const getPreferences = asyncHandler(async (req, res) => {
    const { recipientType, recipientIds } = await resolveRecipient(req);
    const prefs = await notificationModel.getPreferences(recipientType, recipientIds[0] || req.user.id);
    res.status(200).json({ success: true, preferences: prefs });
});

const updatePreferences = asyncHandler(async (req, res) => {
    const { recipientType, recipientIds } = await resolveRecipient(req);
    const prefs = await notificationModel.upsertPreferences(recipientType, recipientIds[0] || req.user.id, req.body);
    res.status(200).json({ success: true, preferences: prefs });
});

module.exports = { myNotifications, myUnreadCount, markRead, markAllRead, getPreferences, updatePreferences };
