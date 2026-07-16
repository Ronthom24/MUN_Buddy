const asyncHandler = require("../utils/asyncHandler");
const analyticsService = require("../services/analyticsService");

const overview = asyncHandler(async (req, res) => {
    const analytics = await analyticsService.getOverview(req.conference);
    res.status(200).json({ success: true, analytics });
});

module.exports = { overview };
