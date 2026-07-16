const asyncHandler = require("../utils/asyncHandler");
const awardModel = require("../models/awardModel");
const resultsService = require("../services/resultsService");

const listAwards = asyncHandler(async (req, res) => {
    const awards = await awardModel.listByConference(req.conference.id);
    res.status(200).json({ success: true, awards });
});

const createAward = asyncHandler(async (req, res) => {
    const award = await resultsService.createAward(req.conference.id, req.body, req.access.id);
    res.status(201).json({ success: true, award });
});

const updateAward = asyncHandler(async (req, res) => {
    const award = await resultsService.updateAward(req.conference.id, Number(req.params.awardId), req.body);
    res.status(200).json({ success: true, award });
});

const removeAward = asyncHandler(async (req, res) => {
    await resultsService.removeAward(req.conference.id, Number(req.params.awardId));
    res.status(204).send();
});

const publish = asyncHandler(async (req, res) => {
    const conference = await resultsService.publishResults(req.conference.id);
    res.status(200).json({ success: true, conference });
});

const myResults = asyncHandler(async (req, res) => {
    const results = await resultsService.getDelegateResults(req.user.id, req.user.conferenceId);
    res.status(200).json({ success: true, ...results });
});

module.exports = { listAwards, createAward, updateAward, removeAward, publish, myResults };
