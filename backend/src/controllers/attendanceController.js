const asyncHandler = require("../utils/asyncHandler");
const attendanceService = require("../services/attendanceService");

const myCheckinToken = asyncHandler(async (req, res) => {
    const result = await attendanceService.getOrCreateOwnToken(req.user.id);
    res.status(200).json({ success: true, ...result });
});

const getRoster = asyncHandler(async (req, res) => {
    const result = await attendanceService.getRosterForEvent(req.conference.id, Number(req.params.eventId));
    res.status(200).json({ success: true, ...result });
});

const checkIn = asyncHandler(async (req, res) => {
    const result = await attendanceService.checkIn(req.conference.id, Number(req.params.eventId), req.body, req.access.id);
    res.status(201).json({ success: true, ...result });
});

const undoCheckIn = asyncHandler(async (req, res) => {
    await attendanceService.undoCheckIn(req.conference.id, Number(req.params.eventId), Number(req.params.delegateId));
    res.status(204).send();
});

const analytics = asyncHandler(async (req, res) => {
    const data = await attendanceService.getAnalytics(req.conference.id);
    res.status(200).json({ success: true, analytics: data });
});

module.exports = { myCheckinToken, getRoster, checkIn, undoCheckIn, analytics };
