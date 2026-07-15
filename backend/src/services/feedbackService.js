const feedbackModel = require("../models/feedbackModel");
const organizerAccessModel = require("../models/organizerAccessModel");

async function listForConference(conferenceId, requesterEmail) {
    const access = await organizerAccessModel.findByConferenceAndEmail(conferenceId, requesterEmail);
    const canSeeIdentity = access && access.role === "owner";

    const rows = await feedbackModel.listByConference(conferenceId);

    return rows.map((row) => ({
        id: row.id,
        rating: row.rating,
        category: row.category,
        comments: row.comments,
        createdAt: row.created_at,
        delegateName: canSeeIdentity ? row.delegate_name : "Anonymous"
    }));
}

module.exports = { listForConference };
