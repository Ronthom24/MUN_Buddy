const asyncHandler = require("../utils/asyncHandler");
const delegateModel = require("../models/delegateModel");
const delegateService = require("../services/delegateService");
const resourceModel = require("../models/resourceModel");
const assignmentModel = require("../models/assignmentModel");

const listForConference = asyncHandler(async (req, res) => {
    const delegates = await delegateModel.listByConference(req.conference.id);
    res.status(200).json({ success: true, delegates });
});

const updateStatus = asyncHandler(async (req, res) => {
    const delegate = await delegateModel.updateStatus(req.delegateRecord.id, req.body.status);
    res.status(200).json({ success: true, delegate });
});

const me = asyncHandler(async (req, res) => {
    const profile = await delegateService.getOwnProfile(req.user.id);
    res.status(200).json({ success: true, ...profile });
});

const myResources = asyncHandler(async (req, res) => {
    const assignment = await assignmentModel.findByDelegateId(req.user.id);
    const isAssignedAndPublished = Boolean(assignment && assignment.published);

    const resources = await resourceModel.listVisibleToDelegate(req.user.conferenceId, { isAssignedAndPublished });
    res.status(200).json({ success: true, resources });
});

module.exports = { listForConference, updateStatus, me, myResources };
