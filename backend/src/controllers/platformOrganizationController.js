const asyncHandler = require("../utils/asyncHandler");
const platformOrganizationService = require("../services/platformOrganizationService");

const list = asyncHandler(async (req, res) => {
    const organizations = await platformOrganizationService.listOrganizations({
        search: req.query.search, status: req.query.status
    });
    res.status(200).json({ success: true, organizations });
});

const detail = asyncHandler(async (req, res) => {
    const result = await platformOrganizationService.getOrganization(Number(req.params.id));
    res.status(200).json({ success: true, ...result });
});

const setStatus = asyncHandler(async (req, res) => {
    const organization = await platformOrganizationService.setOrganizationStatus(Number(req.params.id), req.body.status);
    res.status(200).json({ success: true, organization });
});

const remove = asyncHandler(async (req, res) => {
    await platformOrganizationService.deleteOrganization(Number(req.params.id));
    res.status(200).json({ success: true, message: "Organization deleted" });
});

module.exports = { list, detail, setStatus, remove };
