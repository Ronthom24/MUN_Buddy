const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const resourceModel = require("../models/resourceModel");
const organizerAccessModel = require("../models/organizerAccessModel");
const assignmentModel = require("../models/assignmentModel");

const listForConference = asyncHandler(async (req, res) => {
    const resources = await resourceModel.listByConference(req.conference.id);
    res.status(200).json({ success: true, resources });
});

const create = asyncHandler(async (req, res) => {
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;
    const resourceId = await resourceModel.create({
        conferenceId: req.conference.id,
        committeeId: req.body.committeeId || null,
        title: req.body.title,
        category: req.body.category,
        description: req.body.description,
        filePath,
        visibility: req.body.visibility,
        status: req.body.status
    });
    const resource = await resourceModel.findById(resourceId);
    res.status(201).json({ success: true, resource });
});

const update = asyncHandler(async (req, res) => {
    const resource = await resourceModel.update(req.resource.id, req.body);
    res.status(200).json({ success: true, resource });
});

const remove = asyncHandler(async (req, res) => {
    await resourceModel.remove(req.resource.id);
    res.status(204).send();
});

const download = asyncHandler(async (req, res) => {
    const resource = await resourceModel.findById(req.params.id);
    if (!resource) throw new ApiError(404, "Resource not found");

    let allowed = false;

    if (req.user.role === "organizer") {
        const access = await organizerAccessModel.findByConferenceAndEmail(resource.conference_id, req.user.email);
        allowed = Boolean(access);
    } else if (req.user.role === "delegate" && req.user.conferenceId === resource.conference_id) {
        if (resource.status === "published") {
            if (resource.visibility === "all") {
                allowed = true;
            } else if (resource.visibility === "assigned") {
                const assignment = await assignmentModel.findByDelegateId(req.user.id);
                allowed = Boolean(assignment && assignment.published);
            }
        }
    }

    if (!allowed || !resource.file_path) {
        throw new ApiError(403, "You do not have access to download this resource");
    }

    await resourceModel.incrementDownloadCount(resource.id);
    res.redirect(resource.file_path);
});

module.exports = { listForConference, create, update, remove, download };
