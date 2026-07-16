const asyncHandler = require("../utils/asyncHandler");
const conferenceModel = require("../models/conferenceModel");
const auditLogService = require("../services/auditLogService");

const listOpen = asyncHandler(async (req, res) => {
    const conferences = await conferenceModel.listOpenForRegistration();
    res.status(200).json({ success: true, conferences });
});

const listMine = asyncHandler(async (req, res) => {
    const conferences = await conferenceModel.listByAccessEmail(req.user.email);
    res.status(200).json({ success: true, conferences });
});

const getOne = asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, conference: req.conference });
});

const update = asyncHandler(async (req, res) => {
    const previous = req.conference;
    const conference = await conferenceModel.update(req.conference.id, req.body);
    await auditLogService.log({
        conferenceId: conference.id, user: req.user, action: "conference.settings_update",
        resourceType: "conference", resourceId: conference.id, previousValue: previous, newValue: conference
    });
    res.status(200).json({ success: true, conference });
});

const stats = asyncHandler(async (req, res) => {
    const data = await conferenceModel.getStats(req.conference.id);
    res.status(200).json({ success: true, stats: data });
});

const analytics = asyncHandler(async (req, res) => {
    const data = await conferenceModel.getAnalytics(req.conference.id);
    res.status(200).json({ success: true, analytics: data });
});

const remove = asyncHandler(async (req, res) => {
    await conferenceModel.remove(req.conference.id);
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "conference.remove",
        resourceType: "conference", resourceId: req.conference.id, previousValue: req.conference
    });
    res.status(204).send();
});

module.exports = { listOpen, listMine, getOne, update, stats, analytics, remove };
