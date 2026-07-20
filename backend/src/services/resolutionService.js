const ApiError = require("../utils/ApiError");
const resolutionModel = require("../models/resolutionModel");
const organizerAccessModel = require("../models/organizerAccessModel");

function assertOwnDraft(resolution, delegateId, action = "edited") {
    if (resolution.delegate_id !== delegateId) {
        throw new ApiError(403, "This is not your resolution");
    }
    if (resolution.status !== "draft") {
        throw new ApiError(400, `Only draft resolutions can be ${action}`);
    }
}

async function updateOwn(resolutionId, delegateId, { title, body }) {
    const resolution = await resolutionModel.findById(resolutionId);
    if (!resolution) throw new ApiError(404, "Resolution not found");

    assertOwnDraft(resolution, delegateId);
    return resolutionModel.updateContent(resolutionId, { title, body });
}

async function submitOwn(resolutionId, delegateId) {
    const resolution = await resolutionModel.findById(resolutionId);
    if (!resolution) throw new ApiError(404, "Resolution not found");

    assertOwnDraft(resolution, delegateId);
    return resolutionModel.updateStatus(resolutionId, { status: "submitted" });
}

async function review(resolutionId, { status, organizerNotes }) {
    const resolution = await resolutionModel.findById(resolutionId);
    if (!resolution) throw new ApiError(404, "Resolution not found");

    if (resolution.status === "draft") {
        throw new ApiError(400, "Draft resolutions have not been submitted yet");
    }

    return resolutionModel.updateStatus(resolutionId, { status, organizerNotes });
}

async function remove(resolutionId, user) {
    const resolution = await resolutionModel.findById(resolutionId);
    if (!resolution) throw new ApiError(404, "Resolution not found");

    if (user.role === "delegate") {
        assertOwnDraft(resolution, user.id, "deleted");
        return resolutionModel.remove(resolutionId);
    }

    const access = await organizerAccessModel.findByConferenceAndEmail(resolution.conference_id, user.email);
    const allowed = access && (
        ["owner", "conference_manager", "admin"].includes(access.role) ||
        (access.role === "committee_director" && access.committee_id === resolution.committee_id)
    );

    if (!allowed) throw new ApiError(403, "You do not have access to delete this resolution");
    return resolutionModel.remove(resolutionId);
}

module.exports = { updateOwn, submitOwn, review, remove };
