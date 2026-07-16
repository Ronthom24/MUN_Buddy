const asyncHandler = require("../utils/asyncHandler");
const committeeModel = require("../models/committeeModel");
const teamActivityService = require("../services/teamActivityService");
const auditLogService = require("../services/auditLogService");

const listForConference = asyncHandler(async (req, res) => {
    const conferenceId = Number(req.params.conferenceId || req.params.id);
    const committees = await committeeModel.listByConference(conferenceId);
    res.status(200).json({ success: true, committees });
});

const create = asyncHandler(async (req, res) => {
    const committeeId = await committeeModel.create({ conferenceId: req.conference.id, ...req.body });
    const committee = await committeeModel.findById(committeeId);
    await teamActivityService.log(req.conference.id, req.user, `created the "${committee.name}" committee`);
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "committee.create",
        resourceType: "committee", resourceId: committee.id, newValue: committee
    });
    res.status(201).json({ success: true, committee });
});

const getOne = asyncHandler(async (req, res) => {
    const committee = req.committee || await committeeModel.findById(req.params.id);
    res.status(200).json({ success: true, committee });
});

const update = asyncHandler(async (req, res) => {
    const previous = req.committee;
    const committee = await committeeModel.update(req.committee.id, req.body);
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "committee.update",
        resourceType: "committee", resourceId: committee.id, previousValue: previous, newValue: committee
    });
    res.status(200).json({ success: true, committee });
});

const remove = asyncHandler(async (req, res) => {
    await committeeModel.remove(req.committee.id);
    await teamActivityService.log(req.conference.id, req.user, `removed the "${req.committee.name}" committee`);
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "committee.remove",
        resourceType: "committee", resourceId: req.committee.id, previousValue: req.committee
    });
    res.status(204).send();
});

const stats = asyncHandler(async (req, res) => {
    const data = await committeeModel.getStats(Number(req.params.id));
    res.status(200).json({ success: true, stats: data });
});

module.exports = { listForConference, create, getOne, update, remove, stats };
