const asyncHandler = require("../utils/asyncHandler");
const platformAdminViewService = require("../services/platformAdminViewService");

const mintAdminView = asyncHandler(async (req, res) => {
    const result = await platformAdminViewService.mintAdminViewToken(req.platformAdmin, Number(req.params.id));
    res.status(200).json({ success: true, ...result });
});

module.exports = { mintAdminView };
