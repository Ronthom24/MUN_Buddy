const ApiError = require("../utils/ApiError");
const broadcastModel = require("../models/broadcastModel");
const delegateModel = require("../models/delegateModel");
const assignmentModel = require("../models/assignmentModel");
const emailService = require("../services/emailService");

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
