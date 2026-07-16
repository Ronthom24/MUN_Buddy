const asyncHandler = require("../utils/asyncHandler");
const delegateService = require("../services/delegateService");
const resourceModel = require("../models/resourceModel");
const assignmentModel = require("../models/assignmentModel");
const announcementModel = require("../models/announcementModel");
const scheduleModel = require("../models/scheduleModel");

const listForConference = asyncHandler(async (req, res) => {
    const { status, munExperience, search } = req.query;
    const delegates = await delegateService.listForConference(req.conference.id, { status, munExperience, search });
    res.status(200).json({ success: true, delegates });
});

const updateStatus = asyncHandler(async (req, res) => {
    const delegate = await delegateService.updateStatus(req.delegateRecord.id, req.body.status, req.conference);
    res.status(200).json({ success: true, delegate });
});

const bulkUpdateStatus = asyncHandler(async (req, res) => {
    const { delegates, skippedForPayment } = await delegateService.bulkUpdateStatus(
        req.body.delegateIds || [], req.body.status, req.conference
    );
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
    await delegateService.changeOwnPassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.status(200).json({ success: true, message: "Password updated" });
});

const myResources = asyncHandler(async (req, res) => {
    const assignment = await assignmentModel.findByDelegateId(req.user.id);
    const isAssignedAndPublished = Boolean(assignment && assignment.published);

    const resources = await resourceModel.listVisibleToDelegate(req.user.conferenceId, { isAssignedAndPublished });
    res.status(200).json({ success: true, resources });
});

const myAnnouncements = asyncHandler(async (req, res) => {
    const announcements = await announcementModel.listVisibleToDelegate(req.user.conferenceId);
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
