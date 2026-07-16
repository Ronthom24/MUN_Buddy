const ApiError = require("../utils/ApiError");
const awardModel = require("../models/awardModel");
const conferenceModel = require("../models/conferenceModel");
const delegateModel = require("../models/delegateModel");

async function createAward(conferenceId, data, assignedByAccessId) {
    const delegate = await delegateModel.findById(data.delegateId);
    if (!delegate || delegate.conference_id !== conferenceId) throw new ApiError(404, "Delegate not found");

    return awardModel.create({ conferenceId, assignedByAccessId, ...data });
}

async function updateAward(conferenceId, awardId, data) {
    const award = await awardModel.findById(awardId);
    if (!award || award.conference_id !== conferenceId) throw new ApiError(404, "Award not found");

    return awardModel.update(awardId, data);
}

/**
 * Spec 19.17: results are permanent once published -- awards may still be
 * edited (citations, categories) but not deleted after the conference's
 * results have gone live.
 */
async function removeAward(conferenceId, awardId) {
    const award = await awardModel.findById(awardId);
    if (!award || award.conference_id !== conferenceId) throw new ApiError(404, "Award not found");

    const conference = await conferenceModel.findById(conferenceId);
    if (conference.results_published) throw new ApiError(400, "Results are published; this award can no longer be deleted");

    await awardModel.remove(awardId);
}

async function publishResults(conferenceId) {
    return conferenceModel.publishResults(conferenceId);
}

async function getDelegateResults(delegateId, conferenceId) {
    const conference = await conferenceModel.findById(conferenceId);
    const resultsPublished = Boolean(conference.results_published);

    const ownAwards = await awardModel.listByDelegate(delegateId);
    const allAwards = resultsPublished ? await awardModel.listByConference(conferenceId) : [];

    return { resultsPublished, resultsPublishedAt: conference.results_published_at, ownAwards, allAwards };
}

module.exports = { createAward, updateAward, removeAward, publishResults, getDelegateResults };
