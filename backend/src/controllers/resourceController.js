const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const resourceModel = require("../models/resourceModel");
const organizerAccessModel = require("../models/organizerAccessModel");
const assignmentModel = require("../models/assignmentModel");
const auditLogService = require("../services/auditLogService");

const listForConference = asyncHandler(async (req, res) => {
    const { search, category, tag } = req.query;
    const resources = await resourceModel.listByConference(req.conference.id, { search, category, tag });
    res.status(200).json({ success: true, resources });
});

const create = asyncHandler(async (req, res) => {
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;
    const resourceId = await resourceModel.create({
        conferenceId: req.conference.id,
        committeeId: req.body.committeeId || null,
        portfolioId: req.body.portfolioId || null,
        title: req.body.title,
        category: req.body.category,
        tags: req.body.tags,
        description: req.body.description,
        filePath,
        visibility: req.body.visibility,
        status: req.body.status
    });
    const resource = await resourceModel.findById(resourceId);
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "resource.create",
        resourceType: "resource", resourceId: resource.id, newValue: resource
    });
    res.status(201).json({ success: true, resource });
});

const update = asyncHandler(async (req, res) => {
    const previous = req.resource;
    const resource = await resourceModel.update(req.resource.id, req.body);
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "resource.update",
        resourceType: "resource", resourceId: resource.id, previousValue: previous, newValue: resource
    });
    res.status(200).json({ success: true, resource });
});

const uploadVersion = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "A file is required");
    const filePath = `/uploads/${req.file.filename}`;
    const resource = await resourceModel.addVersion(req.resource.id, filePath, req.user.email);
    res.status(200).json({ success: true, resource });
});

const listVersions = asyncHandler(async (req, res) => {
    const versions = await resourceModel.listVersions(req.resource.id);
    res.status(200).json({ success: true, versions });
});

const remove = asyncHandler(async (req, res) => {
    await resourceModel.remove(req.resource.id);
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "resource.remove",
        resourceType: "resource", resourceId: req.resource.id, previousValue: req.resource
    });
    res.status(204).send();
});

async function resolveDownloadAccess(resource, user) {
    if (user.role === "organizer") {
        const access = await organizerAccessModel.findByConferenceAndEmail(resource.conference_id, user.email);
        return Boolean(access);
    }
    if (user.role === "delegate" && user.conferenceId === resource.conference_id) {
        if (resource.status !== "published") return false;
        if (resource.visibility === "all") return true;
        if (resource.visibility === "assigned") {
            const assignment = await assignmentModel.findByDelegateId(user.id);
            if (!assignment || !assignment.published) return false;
            if (resource.committee_id && assignment.committee_id !== resource.committee_id) return false;
            if (resource.portfolio_id && assignment.portfolio_id !== resource.portfolio_id) return false;
            return true;
        }
    }
    return false;
}

const download = asyncHandler(async (req, res) => {
    const resource = await resourceModel.findById(req.params.id);
    if (!resource) throw new ApiError(404, "Resource not found");

    const allowed = await resolveDownloadAccess(resource, req.user);
    if (!allowed || !resource.file_path) {
        throw new ApiError(403, "You do not have access to download this resource");
    }

    await resourceModel.incrementDownloadCount(resource.id);
    res.redirect(resource.file_path);
});

const preview = asyncHandler(async (req, res) => {
    const resource = await resourceModel.findById(req.params.id);
    if (!resource) throw new ApiError(404, "Resource not found");

    const allowed = await resolveDownloadAccess(resource, req.user);
    if (!allowed || !resource.file_path) {
        throw new ApiError(403, "You do not have access to preview this resource");
    }

    res.redirect(resource.file_path);
});

module.exports = { listForConference, create, update, remove, download, preview, uploadVersion, listVersions };
