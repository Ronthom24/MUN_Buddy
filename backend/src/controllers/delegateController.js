const asyncHandler = require("../utils/asyncHandler");
const delegateService = require("../services/delegateService");
const resourceModel = require("../models/resourceModel");
const assignmentModel = require("../models/assignmentModel");
const announcementModel = require("../models/announcementModel");
const scheduleModel = require("../models/scheduleModel");
const notificationService = require("../services/notificationService");
const teamActivityService = require("../services/teamActivityService");
const auditLogService = require("../services/auditLogService");

const STATUS_MESSAGE = {
    approved: "Your registration has been approved",
    rejected: "Your registration was not approved",
    waitlisted: "You have been placed on the waitlist"
};

async function notifyStatusChange(delegate, conferenceId) {
    const message = STATUS_MESSAGE[delegate.status];
    if (!message) return;
    await notificationService.notify({
        conferenceId,
        recipientType: "delegate",
        recipientId: delegate.id,
        type: delegate.status === "approved" ? "success" : "warning",
        title: message,
        message: `Status: ${delegate.status}`,
        link: "/delegate"
    });
}

const listForConference = asyncHandler(async (req, res) => {
    const { status, munExperience, search } = req.query;
    const delegates = await delegateService.listForConference(req.conference.id, { status, munExperience, search });
    res.status(200).json({ success: true, delegates });
});

const updateStatus = asyncHandler(async (req, res) => {
    const previousStatus = req.delegateRecord.status;
    const delegate = await delegateService.updateStatus(req.delegateRecord.id, req.body.status, req.conference);
    await notifyStatusChange(delegate, req.conference.id);
    await teamActivityService.log(req.conference.id, req.user, `set ${delegate.full_name}'s status to ${delegate.status}`);
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "registration.status_change",
        resourceType: "delegate", resourceId: delegate.id,
        previousValue: { status: previousStatus }, newValue: { status: delegate.status }
    });
    res.status(200).json({ success: true, delegate });
});

const bulkUpdateStatus = asyncHandler(async (req, res) => {
    const { delegates, skippedForPayment } = await delegateService.bulkUpdateStatus(
        req.body.delegateIds || [], req.body.status, req.conference
    );
    await Promise.all(delegates.map((d) => notifyStatusChange(d, req.conference.id)));
    if (delegates.length > 0) {
        await teamActivityService.log(
            req.conference.id, req.user, `set ${delegates.length} delegate(s) to ${req.body.status}`
        );
        await auditLogService.log({
            conferenceId: req.conference.id, user: req.user, action: "registration.bulk_status_change",
            resourceType: "delegate", newValue: { status: req.body.status, delegateIds: delegates.map((d) => d.id) }
        });
    }
    res.status(200).json({ success: true, delegates, skippedForPayment });
});

const registrationAnalytics = asyncHandler(async (req, res) => {
    const data = await delegateService.getRegistrationAnalytics(req.conference.id);
    res.status(200).json({ success: true, analytics: data });
});

const reapply = asyncHandler(async (req, res) => {
    const delegate = await delegateService.reapply(req.user.id);
    res.status(200).json({ success: true, delegate });
});

const me = asyncHandler(async (req, res) => {
    const profile = await delegateService.getOwnProfile(req.user.id);
    res.status(200).json({ success: true, ...profile });
});

const updateMe = asyncHandler(async (req, res) => {
    const delegate = await delegateService.updateOwnProfile(req.user.id, req.body);
    res.status(200).json({ success: true, delegate });
});

const changePassword = asyncHandler(async (req, res) => {
    await delegateService.changeOwnPassword(
        req.user.profileId || req.user.id, req.user.email, req.body.currentPassword, req.body.newPassword
    );
    res.status(200).json({ success: true, message: "Password updated" });
});

const myResources = asyncHandler(async (req, res) => {
    const assignment = await assignmentModel.findByDelegateId(req.user.id);
    const isAssignedAndPublished = Boolean(assignment && assignment.published);

    const resources = await resourceModel.listVisibleToDelegate(req.user.conferenceId, {
        isAssignedAndPublished,
        committeeId: assignment?.committee_id,
        portfolioId: assignment?.portfolio_id
    });
    res.status(200).json({ success: true, resources });
});

const myAnnouncements = asyncHandler(async (req, res) => {
    const assignment = await assignmentModel.findByDelegateId(req.user.id);
    const announcements = await announcementModel.listVisibleToDelegate(req.user.conferenceId, {
        delegateId: req.user.id,
        committeeId: assignment?.published ? assignment.committee_id : undefined,
        portfolioId: assignment?.published ? assignment.portfolio_id : undefined
    });
    res.status(200).json({ success: true, announcements });
});

const mySchedule = asyncHandler(async (req, res) => {
    const days = await scheduleModel.listForConference(req.user.conferenceId);
    res.status(200).json({ success: true, days });
});

module.exports = {
    listForConference, updateStatus, bulkUpdateStatus, registrationAnalytics, reapply, me, updateMe,
    changePassword, myResources, myAnnouncements, mySchedule
};
