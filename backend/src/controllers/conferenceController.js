const asyncHandler = require("../utils/asyncHandler");
const conferenceModel = require("../models/conferenceModel");

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
    const conference = await conferenceModel.update(req.conference.id, req.body);
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
    res.status(204).send();
});

module.exports = { listOpen, listMine, getOne, update, stats, analytics, remove };
