const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const organizationModel = require("../models/organizationModel");
const conferenceModel = require("../models/conferenceModel");
const committeeModel = require("../models/committeeModel");
const resourceModel = require("../models/resourceModel");
const faqModel = require("../models/faqModel");
const pool = require("../config/database");

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
    const conferences = await conferenceModel.listPublic({
        search: req.query.search,
        country: req.query.country,
        month: req.query.month,
        registrationStatus: req.query.registrationStatus,
        organizationSlug: req.query.organization,
    });
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

const getStats = asyncHandler(async (req, res) => {
    const [[{ organizations }]] = await pool.query(
        `SELECT COUNT(*) AS organizations FROM organizations WHERE status = 'active' AND is_publicly_listed = TRUE AND deleted_at IS NULL`
    );
    const [[{ conferences }]] = await pool.query(
        `SELECT COUNT(*) AS conferences FROM conferences c INNER JOIN organizations o ON o.id = c.organization_id
         WHERE c.status = 'published' AND c.deleted_at IS NULL AND c.is_publicly_listed = TRUE AND o.is_publicly_listed = TRUE`
    );
    const [[{ delegates }]] = await pool.query(`SELECT COUNT(*) AS delegates FROM delegates WHERE status = 'approved'`);
    const [[{ countries }]] = await pool.query(
        `SELECT COUNT(DISTINCT p.name) AS countries
         FROM portfolios p
         INNER JOIN committees c ON c.id = p.committee_id
         INNER JOIN conferences co ON co.id = c.conference_id
         WHERE p.type = 'country' AND p.status = 'assigned' AND co.is_publicly_listed = TRUE`
    );
    res.status(200).json({ success: true, stats: { organizations, conferences, delegates, countries } });
});

const downloadResource = asyncHandler(async (req, res) => {
    const resource = await resourceModel.findById(req.params.resourceId);
    if (!resource || resource.status !== "published" || resource.visibility !== "all" || !resource.file_path) {
        throw new ApiError(404, "Resource not found");
    }

    await resourceModel.incrementDownloadCount(resource.id);
    res.redirect(resource.file_path);
});

module.exports = { listOrganizations, getOrganization, listConferences, getConference, getStats, downloadResource };
