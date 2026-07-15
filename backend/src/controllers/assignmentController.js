const asyncHandler = require("../utils/asyncHandler");
const assignmentModel = require("../models/assignmentModel");
const assignmentService = require("../services/assignmentService");

const listForConference = asyncHandler(async (req, res) => {
    const assignments = await assignmentModel.listByConference(req.conference.id);
    res.status(200).json({ success: true, assignments });
});

const assign = asyncHandler(async (req, res) => {
    const delegateId = Number(req.params.delegateId);
    const assignment = await assignmentService.assign(req.conference.id, delegateId, req.body);
    res.status(200).json({ success: true, assignment });
});

const publish = asyncHandler(async (req, res) => {
    const assignments = await assignmentService.publish(req.conference.id);
    res.status(200).json({ success: true, assignments });
});

module.exports = { listForConference, assign, publish };
