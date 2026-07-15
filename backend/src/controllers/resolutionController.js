const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const resolutionModel = require("../models/resolutionModel");
const committeeModel = require("../models/committeeModel");
const resolutionService = require("../services/resolutionService");

const create = asyncHandler(async (req, res) => {
    const committee = await committeeModel.findById(req.body.committeeId);
    if (!committee || committee.conference_id !== req.user.conferenceId) {
        throw new ApiError(400, "That committee does not belong to your conference");
    }

    const resolutionId = await resolutionModel.create({
        conferenceId: req.user.conferenceId,
        committeeId: req.body.committeeId,
        agendaId: req.body.agendaId,
        delegateId: req.user.id,
        title: req.body.title,
        body: req.body.body
    });

    const resolution = await resolutionModel.findById(resolutionId);
    res.status(201).json({ success: true, resolution });
});

const listMine = asyncHandler(async (req, res) => {
    const resolutions = await resolutionModel.listByDelegate(req.user.id);
    res.status(200).json({ success: true, resolutions });
});

const listForConference = asyncHandler(async (req, res) => {
    let resolutions = await resolutionModel.listByConference(req.conference.id);

    if (req.access.role === "committee_director") {
        resolutions = resolutions.filter((r) => r.committee_id === req.access.committeeId);
    }

    res.status(200).json({ success: true, resolutions });
});

const updateContent = asyncHandler(async (req, res) => {
    const resolution = await resolutionService.updateOwn(req.resolution.id, req.user.id, req.body);
    res.status(200).json({ success: true, resolution });
});

const submit = asyncHandler(async (req, res) => {
    const resolution = await resolutionService.submitOwn(req.resolution.id, req.user.id);
    res.status(200).json({ success: true, resolution });
});

const updateStatus = asyncHandler(async (req, res) => {
    const resolution = await resolutionService.review(req.resolution.id, {
        status: req.body.status,
        organizerNotes: req.body.organizerNotes
    });
    res.status(200).json({ success: true, resolution });
});

const remove = asyncHandler(async (req, res) => {
    await resolutionService.remove(Number(req.params.id), req.user);
    res.status(204).send();
});

module.exports = { create, listMine, listForConference, updateContent, submit, updateStatus, remove };
