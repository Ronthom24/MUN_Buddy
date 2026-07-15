const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const organizationModel = require("../models/organizationModel");
const conferenceModel = require("../models/conferenceModel");
const authService = require("../services/authService");

const listMine = asyncHandler(async (req, res) => {
    const organizations = await organizationModel.listByMemberEmail(req.user.email);
    res.status(200).json({ success: true, organizations });
});

const getOne = asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, organization: req.organization, membership: req.orgAccess });
});

const update = asyncHandler(async (req, res) => {
    const organization = await organizationModel.update(req.organization.id, req.body);
    res.status(200).json({ success: true, organization });
});

const stats = asyncHandler(async (req, res) => {
    const data = await organizationModel.getStats(req.organization.id);
    res.status(200).json({ success: true, stats: data });
});

const listConferences = asyncHandler(async (req, res) => {
    const conferences = await conferenceModel.listByOrganization(req.organization.id);
    res.status(200).json({ success: true, conferences });
});

const createConference = asyncHandler(async (req, res) => {
    if (!req.body.conferenceName || !req.body.startDate || !req.body.endDate || !req.body.registrationDeadline) {
        throw new ApiError(400, "conferenceName, startDate, endDate, and registrationDeadline are required");
    }

    const conference = await authService.createConferenceForOrganization(req.organization.id, req.body, req.user.email);
    res.status(201).json({ success: true, conference });
});

module.exports = { listMine, getOne, update, stats, listConferences, createConference };
