const asyncHandler = require("../utils/asyncHandler");
const announcementModel = require("../models/announcementModel");

const listForConference = asyncHandler(async (req, res) => {
    const announcements = await announcementModel.listByConference(req.conference.id);
    res.status(200).json({ success: true, announcements });
});

const create = asyncHandler(async (req, res) => {
    const announcementId = await announcementModel.create({ conferenceId: req.conference.id, ...req.body });
    const announcement = await announcementModel.findById(announcementId);
    res.status(201).json({ success: true, announcement });
});

const update = asyncHandler(async (req, res) => {
    const announcement = await announcementModel.update(req.announcement.id, req.body);
    res.status(200).json({ success: true, announcement });
});

const remove = asyncHandler(async (req, res) => {
    await announcementModel.remove(req.announcement.id);
    res.status(204).send();
});

module.exports = { listForConference, create, update, remove };
