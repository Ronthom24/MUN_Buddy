const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const feedbackModel = require("../models/feedbackModel");
const feedbackService = require("../services/feedbackService");

const create = asyncHandler(async (req, res) => {
    const conferenceId = Number(req.params.id);
    if (conferenceId !== req.user.conferenceId) {
        throw new ApiError(403, "You can only submit feedback for your own conference");
    }

    const feedbackId = await feedbackModel.create({
        conferenceId,
        delegateId: req.user.id,
        rating: req.body.rating,
        category: req.body.category,
        comments: req.body.comments
    });

    res.status(201).json({ success: true, feedbackId });
});

const listForConference = asyncHandler(async (req, res) => {
    const feedback = await feedbackService.listForConference(req.conference.id, req.user.email);
    res.status(200).json({ success: true, feedback });
});

const remove = asyncHandler(async (req, res) => {
    await feedbackModel.remove(req.feedback.id);
    res.status(204).send();
});

module.exports = { create, listForConference, remove };
