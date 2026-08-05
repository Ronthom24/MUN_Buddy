const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const organizerAccessModel = require("../models/organizerAccessModel");
const committeeModel = require("../models/committeeModel");
const teamActivityService = require("../services/teamActivityService");
const auditLogService = require("../services/auditLogService");

const list = asyncHandler(async (req, res) => {
    const access = await organizerAccessModel.listByConference(req.conference.id);
    res.status(200).json({
        success: true,
        organizerAccess: access.map((row) => ({
            id: row.id,
            email: row.email,
            role: row.role,
            committeeId: row.committee_id,
            departmentId: row.department_id,
            positionTitle: row.position_title,
            fullName: row.full_name,
            claimed: Boolean(row.profile_id),
            createdAt: row.created_at
        }))
    });
});

const invite = asyncHandler(async (req, res) => {
    if (req.body.committeeId) {
        const committee = await committeeModel.findById(req.body.committeeId);
        if (!committee || committee.conference_id !== req.conference.id) {
            throw new ApiError(400, "That committee does not belong to this conference");
        }
    }

    const existing = await organizerAccessModel.findByConferenceAndEmail(req.conference.id, req.body.email);
    if (existing) {
        throw new ApiError(409, "This email already has access to this conference");
    }

    const accessId = await organizerAccessModel.create({
        conferenceId: req.conference.id,
        email: req.body.email,
        role: req.body.role,
        committeeId: req.body.committeeId,
        departmentId: req.body.departmentId,
        positionTitle: req.body.positionTitle
    });

    const access = await organizerAccessModel.findById(accessId);
    await teamActivityService.log(req.conference.id, req.user, `invited ${req.body.email} as ${req.body.role}`);
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "organizer_access.invite",
        resourceType: "organizer_access", resourceId: access.id, newValue: access
    });

    res.status(201).json({ success: true, organizerAccess: access });
});

const update = asyncHandler(async (req, res) => {
    const access = await organizerAccessModel.findById(req.params.accessId);
    if (!access || access.conference_id !== req.conference.id) {
        throw new ApiError(404, "Organizer access entry not found");
    }
    if (access.role === "owner") {
        throw new ApiError(400, "The conference owner's access cannot be modified");
    }

    const updated = await organizerAccessModel.update(access.id, {
        role: req.body.role,
        committeeId: req.body.committeeId,
        departmentId: req.body.departmentId,
        positionTitle: req.body.positionTitle
    });
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "organizer_access.update",
        resourceType: "organizer_access", resourceId: access.id, previousValue: access, newValue: updated
    });
    res.status(200).json({ success: true, organizerAccess: updated });
});

const remove = asyncHandler(async (req, res) => {
    const access = await organizerAccessModel.findById(req.params.accessId);
    if (!access || access.conference_id !== req.conference.id) {
        throw new ApiError(404, "Organizer access entry not found");
    }
    if (access.role === "owner") {
        throw new ApiError(400, "The conference owner's access cannot be revoked");
    }

    await organizerAccessModel.remove(access.id);
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "organizer_access.remove",
        resourceType: "organizer_access", resourceId: access.id, previousValue: access
    });
    res.status(204).send();
});

module.exports = { list, invite, update, remove };
