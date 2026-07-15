const asyncHandler = require("../utils/asyncHandler");
const assignmentModel = require("../models/assignmentModel");
const assignmentService = require("../services/assignmentService");

const listForConference = asyncHandler(async (req, res) => {
    const assignments = await assignmentModel.listByConference(req.conference.id);
    res.status(200).json({ success: true, assignments });
});

const assign = asyncHandler(async (req, res) => {
    const delegateId = Number(req.params.delegateId);
    const assignment = await assignmentService.assign(req.conference.id, delegateId, req.body, req.access.id);
    res.status(200).json({ success: true, assignment });
});

const bulkAssign = asyncHandler(async (req, res) => {
    const results = await assignmentService.bulkAssign(req.conference.id, req.body.assignments || [], req.access.id);
    res.status(200).json({ success: true, results });
});

const unassign = asyncHandler(async (req, res) => {
    const delegateId = Number(req.params.delegateId);
    const assignment = await assignmentService.unassign(req.conference.id, delegateId, req.access.id);
    res.status(200).json({ success: true, assignment });
});

const history = asyncHandler(async (req, res) => {
    const delegateId = Number(req.params.delegateId);
    const entries = await assignmentModel.getHistoryForDelegate(delegateId);
    res.status(200).json({ success: true, history: entries });
});

const publish = asyncHandler(async (req, res) => {
    const assignments = await assignmentService.publish(req.conference.id);
    res.status(200).json({ success: true, assignments });
});

const analytics = asyncHandler(async (req, res) => {
    const data = await assignmentService.getAnalytics(req.conference.id);
    res.status(200).json({ success: true, analytics: data });
});

module.exports = { listForConference, assign, bulkAssign, unassign, history, publish, analytics };
