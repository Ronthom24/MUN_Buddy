const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const organizationModel = require("../models/organizationModel");
const conferenceModel = require("../models/conferenceModel");
const committeeModel = require("../models/committeeModel");
const resourceModel = require("../models/resourceModel");
const faqModel = require("../models/faqModel");

const listOrganizations = asyncHandler(async (req, res) => {
    const organizations = await organizationModel.listPublic({ search: req.query.search });
    res.status(200).json({ success: true, organizations });
});

const getOrganization = asyncHandler(async (req, res) => {
    const organization = await organizationModel.findPublicBySlug(req.params.slug);
    if (!organization) throw new ApiError(404, "Organization not found");

    const conferences = await conferenceModel.listPublic({});
    res.status(200).json({
        success: true,
        organization,
        conferences: conferences.filter((c) => c.organization_id === organization.id)
    });
});

const listConferences = asyncHandler(async (req, res) => {
    const conferences = await conferenceModel.listPublic({ search: req.query.search, country: req.query.country });
    res.status(200).json({ success: true, conferences });
});

const getConference = asyncHandler(async (req, res) => {
    const conference = await conferenceModel.findPublicBySlug(req.params.slug);
    if (!conference) throw new ApiError(404, "Conference not found");

    const [committees, resources, faqs] = await Promise.all([
        committeeModel.listByConference(conference.id),
        resourceModel.listVisibleToDelegate(conference.id, { isAssignedAndPublished: false }),
        faqModel.listPublished(conference.id)
    ]);

    res.status(200).json({ success: true, conference, committees, resources, faqs });
});

const downloadResource = asyncHandler(async (req, res) => {
    const resource = await resourceModel.findById(req.params.resourceId);
    if (!resource || resource.status !== "published" || resource.visibility !== "all" || !resource.file_path) {
        throw new ApiError(404, "Resource not found");
    }

    await resourceModel.incrementDownloadCount(resource.id);
    res.redirect(resource.file_path);
});

module.exports = { listOrganizations, getOrganization, listConferences, getConference, downloadResource };
