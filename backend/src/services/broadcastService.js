const ApiError = require("../utils/ApiError");
const broadcastModel = require("../models/broadcastModel");
const delegateModel = require("../models/delegateModel");
const assignmentModel = require("../models/assignmentModel");
const emailService = require("../services/emailService");

/**
 * Turned off for now: real delivery depends on outbound SMTP to Brevo,
 * which times out from this host (Render's free tier blocks outbound SMTP
 * ports, a common PaaS restriction) -- broadcasts were marking themselves
 * "sent" while every recipient silently failed with "Connection timeout".
 * Re-enable once email sending is switched to Brevo's HTTPS API (port 443,
 * not blocked) instead of raw SMTP. Until then, organizers should use
 * Announcements/Notifications, which delegates see in-app and don't
 * depend on any of this.
 */
const EMAIL_BROADCASTS_ENABLED = false;

async function resolveAudience(conferenceId, { audience, committeeId }) {
    if (audience === "committee" && committeeId) {
        const delegates = await delegateModel.listByConference(conferenceId, { status: "approved" });
        const assignments = await Promise.all(delegates.map((d) => assignmentModel.findByDelegateId(d.id)));
        return delegates.filter((_, i) => assignments[i]?.committee_id === committeeId);
    }

    const statusMap = { all: undefined, approved: "approved", waitlisted: "waitlisted", rejected: "rejected" };
    return delegateModel.listByConference(conferenceId, { status: statusMap[audience] });
}

async function createBroadcast(conference, data, createdByAccessId) {
    if (!EMAIL_BROADCASTS_ENABLED) {
        throw new ApiError(503, "Email broadcasts are temporarily disabled. Use Announcements to reach delegates instead.");
    }

    const recipients = await resolveAudience(conference.id, data);

    const broadcastId = await broadcastModel.create({
        conferenceId: conference.id,
        subject: data.subject,
        body: data.body,
        audience: data.audience,
        committeeId: data.committeeId,
        status: data.scheduledAt ? "scheduled" : "draft",
        scheduledAt: data.scheduledAt,
        createdByAccessId
    });

    await broadcastModel.addRecipients(broadcastId, recipients);
    return broadcastModel.findById(broadcastId);
}

async function sendBroadcast(broadcastId, conferenceId) {
    if (!EMAIL_BROADCASTS_ENABLED) {
        throw new ApiError(503, "Email broadcasts are temporarily disabled. Use Announcements to reach delegates instead.");
    }

    const broadcast = await broadcastModel.findById(broadcastId);
    if (!broadcast || broadcast.conference_id !== conferenceId) throw new ApiError(404, "Broadcast not found");
    if (broadcast.status === "sent") throw new ApiError(400, "This broadcast has already been sent");

    const recipients = await broadcastModel.listRecipients(broadcastId);

    for (const recipient of recipients) {
        try {
            const result = await emailService.sendMail({ to: recipient.email, subject: broadcast.subject, html: broadcast.body });
            await broadcastModel.markRecipientResult(recipient.id, result.delivered || result.mode === "log-only" ? "sent" : "failed");
        } catch (err) {
            await broadcastModel.markRecipientResult(recipient.id, "failed", err.message);
        }
    }

    return broadcastModel.updateStatus(broadcastId, "sent", { sentAt: new Date() });
}

module.exports = { createBroadcast, sendBroadcast };
