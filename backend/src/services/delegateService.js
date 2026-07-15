const ApiError = require("../utils/ApiError");
const delegateModel = require("../models/delegateModel");
const assignmentModel = require("../models/assignmentModel");
const conferenceModel = require("../models/conferenceModel");

async function listForConference(conferenceId, filters) {
    const [delegates, duplicateIds] = await Promise.all([
        delegateModel.listByConference(conferenceId, filters),
        delegateModel.findPossibleDuplicateIds(conferenceId)
    ]);

    return delegates.map((delegate) => ({ ...delegate, possibleDuplicate: duplicateIds.has(delegate.id) }));
}

async function reapply(delegateId) {
    const delegate = await delegateModel.findById(delegateId);
    if (!delegate) throw new ApiError(404, "Delegate not found");
    if (delegate.status !== "rejected") {
        throw new ApiError(400, "Only rejected applications may be resubmitted");
    }

    const conference = await conferenceModel.findById(delegate.conference_id);
    if (!conference || !conference.allow_reapplication) {
        throw new ApiError(403, "This conference does not permit reapplications");
    }

    return delegateModel.updateStatus(delegateId, "pending");
}

async function getRegistrationAnalytics(conferenceId) {
    const delegates = await delegateModel.listByConference(conferenceId);

    const byStatus = { pending: 0, approved: 0, rejected: 0, waitlisted: 0, withdrawn: 0 };
    const bySchool = new Map();
    const byExperience = new Map();
    const byDay = new Map();

    for (const delegate of delegates) {
        byStatus[delegate.status] = (byStatus[delegate.status] || 0) + 1;

        const school = delegate.school || "Unspecified";
        bySchool.set(school, (bySchool.get(school) || 0) + 1);

        byExperience.set(delegate.mun_experience, (byExperience.get(delegate.mun_experience) || 0) + 1);

        const day = new Date(delegate.created_at).toISOString().slice(0, 10);
        byDay.set(day, (byDay.get(day) || 0) + 1);
    }

    const total = delegates.length;
    return {
        totalApplications: total,
        byStatus,
        approvalRate: total > 0 ? Number((byStatus.approved / total).toFixed(2)) : 0,
        institutionDistribution: [...bySchool.entries()].map(([school, count]) => ({ school, count })),
        experienceDistribution: [...byExperience.entries()].map(([experience, count]) => ({ experience, count })),
        registrationsByDay: [...byDay.entries()].sort().map(([day, count]) => ({ day, count }))
    };
}

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

module.exports = { getOwnProfile, listForConference, reapply, getRegistrationAnalytics };
