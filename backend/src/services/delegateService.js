const ApiError = require("../utils/ApiError");
const delegateModel = require("../models/delegateModel");
const assignmentModel = require("../models/assignmentModel");
const conferenceModel = require("../models/conferenceModel");

async function getOwnProfile(delegateId) {
    const delegate = await delegateModel.findById(delegateId);
    if (!delegate) throw new ApiError(404, "Delegate not found");

    const conference = await conferenceModel.findById(delegate.conference_id);
    const committeePreferences = await delegateModel.getCommitteePreferences(delegateId);
    const countryPreferences = await delegateModel.getCountryPreferences(delegateId);
    const assignment = await assignmentModel.findByDelegateId(delegateId);
    const publishedAssignment = assignment && assignment.published
        ? await assignmentModel.findPublishedByDelegateId(delegateId)
        : null;

    return {
        delegate: {
            id: delegate.id,
            fullName: delegate.full_name,
            email: delegate.email,
            school: delegate.school,
            grade: delegate.grade,
            munExperience: delegate.mun_experience,
            status: delegate.status
        },
        conference: conference ? { id: conference.id, name: conference.name, acronym: conference.acronym } : null,
        committeePreferences,
        countryPreferences,
        assignment: publishedAssignment
            ? {
                published: true,
                committee: publishedAssignment.committee_name,
                portfolio: publishedAssignment.portfolio_name,
                portfolioType: publishedAssignment.portfolio_type
            }
            : { published: false }
    };
}

module.exports = { getOwnProfile };
