const asyncHandler = require("../utils/asyncHandler");
const auditLogService = require("../services/auditLogService");

const list = asyncHandler(async (req, res) => {
    const logs = await auditLogService.listForConference(req.conference.id);
    res.status(200).json({ success: true, logs });
});

module.exports = { list };
