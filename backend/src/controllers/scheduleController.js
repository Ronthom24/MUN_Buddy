const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const scheduleModel = require("../models/scheduleModel");

const listForConference = asyncHandler(async (req, res) => {
    const conferenceId = Number(req.params.id);
    const days = await scheduleModel.listForConference(conferenceId);
    res.status(200).json({ success: true, days });
});

const createDay = asyncHandler(async (req, res) => {
    const dayId = await scheduleModel.createDay({
        conferenceId: req.conference.id, dayDate: req.body.dayDate, label: req.body.label
    });
    const day = await scheduleModel.findDayById(dayId);
    res.status(201).json({ success: true, day: { ...day, events: [] } });
});

const removeDay = asyncHandler(async (req, res) => {
    const day = await scheduleModel.findDayById(req.params.dayId);
    if (!day || day.conference_id !== req.conference.id) throw new ApiError(404, "Schedule day not found");
    await scheduleModel.removeDay(day.id);
    res.status(204).send();
});

const createEvent = asyncHandler(async (req, res) => {
    const day = await scheduleModel.findDayById(req.params.dayId);
    if (!day || day.conference_id !== req.conference.id) throw new ApiError(404, "Schedule day not found");

    const eventId = await scheduleModel.createEvent({ scheduleDayId: day.id, ...req.body });
    const event = await scheduleModel.findEventById(eventId);
    res.status(201).json({ success: true, event });
});

const updateEvent = asyncHandler(async (req, res) => {
    const event = await scheduleModel.updateEvent(req.params.eventId, req.body);
    res.status(200).json({ success: true, event });
});

const removeEvent = asyncHandler(async (req, res) => {
    await scheduleModel.removeEvent(req.params.eventId);
    res.status(204).send();
});

module.exports = { listForConference, createDay, removeDay, createEvent, updateEvent, removeEvent };
