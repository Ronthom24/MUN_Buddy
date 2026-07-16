const asyncHandler = require("../utils/asyncHandler");
const announcementModel = require("../models/announcementModel");
const notificationService = require("../services/notificationService");
const delegateModel = require("../models/delegateModel");
const assignmentModel = require("../models/assignmentModel");
const auditLogService = require("../services/auditLogService");

const listForConference = asyncHandler(async (req, res) => {
    await announcementModel.publishDueAnnouncements(req.conference.id);
    const announcements = await announcementModel.listByConference(req.conference.id);
    res.status(200).json({ success: true, announcements });
});

const create = asyncHandler(async (req, res) => {
    const announcementId = await announcementModel.create({ conferenceId: req.conference.id, ...req.body });
    const announcement = await announcementModel.findById(announcementId);

    if (announcement.status === "published") {
        await notifyDelegates(announcement);
        await auditLogService.log({
            conferenceId: req.conference.id, user: req.user, action: "announcement.publish",
            resourceType: "announcement", resourceId: announcement.id, newValue: announcement
        });
    }

    res.status(201).json({ success: true, announcement });
});

const update = asyncHandler(async (req, res) => {
    const wasPublished = req.announcement.status === "published";
    const announcement = await announcementModel.update(req.announcement.id, req.body);

    if (!wasPublished && announcement.status === "published") {
        await notifyDelegates(announcement);
        await auditLogService.log({
            conferenceId: req.conference.id, user: req.user, action: "announcement.publish",
            resourceType: "announcement", resourceId: announcement.id,
            previousValue: req.announcement, newValue: announcement
        });
    }

    res.status(200).json({ success: true, announcement });
});

const remove = asyncHandler(async (req, res) => {
    await announcementModel.remove(req.announcement.id);
    res.status(204).send();
});

const markRead = asyncHandler(async (req, res) => {
    await announcementModel.markRead(req.params.id, req.user.id);
    res.status(200).json({ success: true });
});

async function notifyDelegates(announcement) {
    const delegates = await delegateModel.listByConference(announcement.conference_id, { status: "approved" });
    const recipients = [];

    for (const delegate of delegates) {
        if (announcement.committee_id || announcement.portfolio_id) {
            const assignment = await assignmentModel.findByDelegateId(delegate.id);
            if (!assignment || !assignment.published) continue;
            if (announcement.committee_id && assignment.committee_id !== announcement.committee_id) continue;
            if (announcement.portfolio_id && assignment.portfolio_id !== announcement.portfolio_id) continue;
        }
        recipients.push(delegate.id);
    }

    await notificationService.notifyMany(recipients.map((delegateId) => ({
        conferenceId: announcement.conference_id,
        recipientType: "delegate",
        recipientId: delegateId,
        type: announcement.priority === "urgent" ? "critical" : "info",
        title: "New announcement",
        message: announcement.title,
        link: "/delegate/announcements"
    })));
}

module.exports = { listForConference, create, update, remove, markRead };
