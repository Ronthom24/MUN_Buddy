const asyncHandler = require("../utils/asyncHandler");
const committeeModel = require("../models/committeeModel");

const listForConference = asyncHandler(async (req, res) => {
    const conferenceId = Number(req.params.conferenceId || req.params.id);
    const committees = await committeeModel.listByConference(conferenceId);
    res.status(200).json({ success: true, committees });
});

const create = asyncHandler(async (req, res) => {
    const committeeId = await committeeModel.create({ conferenceId: req.conference.id, ...req.body });
    const committee = await committeeModel.findById(committeeId);
    res.status(201).json({ success: true, committee });
});

const getOne = asyncHandler(async (req, res) => {
    const committee = req.committee || await committeeModel.findById(req.params.id);
    res.status(200).json({ success: true, committee });
});

const update = asyncHandler(async (req, res) => {
    const committee = await committeeModel.update(req.committee.id, req.body);
    res.status(200).json({ success: true, committee });
});

const remove = asyncHandler(async (req, res) => {
    await committeeModel.remove(req.committee.id);
    res.status(204).send();
});

const stats = asyncHandler(async (req, res) => {
    const data = await committeeModel.getStats(Number(req.params.id));
    res.status(200).json({ success: true, stats: data });
});

module.exports = { listForConference, create, getOne, update, remove, stats };
