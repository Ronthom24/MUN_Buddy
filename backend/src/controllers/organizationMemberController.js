const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const organizationMemberModel = require("../models/organizationMemberModel");

const list = asyncHandler(async (req, res) => {
    const members = await organizationMemberModel.listByOrganization(req.organization.id);
    res.status(200).json({ success: true, members });
});

const invite = asyncHandler(async (req, res) => {
    const existing = await organizationMemberModel.findByOrganizationAndEmail(req.organization.id, req.body.email);
    if (existing) {
        throw new ApiError(409, "This email is already a member of this organization");
    }

    const memberId = await organizationMemberModel.create({
        organizationId: req.organization.id,
        email: req.body.email,
        fullName: req.body.fullName,
        orgRole: req.body.orgRole || "member",
        invitedBy: req.user.email
    });

    const member = await organizationMemberModel.findById(memberId);
    res.status(201).json({ success: true, member });
});

const update = asyncHandler(async (req, res) => {
    const member = await organizationMemberModel.findById(req.params.memberId);
    if (!member || member.organization_id !== req.organization.id) {
        throw new ApiError(404, "Organization member not found");
    }
    if (member.org_role === "owner" && req.body.orgRole && req.body.orgRole !== "owner") {
        const members = await organizationMemberModel.listByOrganization(req.organization.id);
        const remainingOwners = members.filter((m) => m.org_role === "owner" && m.id !== member.id);
        if (remainingOwners.length === 0) {
            throw new ApiError(400, "An organization must always have at least one owner");
        }
    }

    const updated = await organizationMemberModel.update(member.id, {
        orgRole: req.body.orgRole,
        status: req.body.status
    });
    res.status(200).json({ success: true, member: updated });
});

const remove = asyncHandler(async (req, res) => {
    const member = await organizationMemberModel.findById(req.params.memberId);
    if (!member || member.organization_id !== req.organization.id) {
        throw new ApiError(404, "Organization member not found");
    }
    if (member.org_role === "owner") {
        const members = await organizationMemberModel.listByOrganization(req.organization.id);
        const remainingOwners = members.filter((m) => m.org_role === "owner" && m.id !== member.id);
        if (remainingOwners.length === 0) {
            throw new ApiError(400, "An organization must always have at least one owner");
        }
    }

    await organizationMemberModel.remove(member.id);
    res.status(204).send();
});

module.exports = { list, invite, update, remove };
