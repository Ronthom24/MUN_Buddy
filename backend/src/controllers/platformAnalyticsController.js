const asyncHandler = require("../utils/asyncHandler");
const platformAnalyticsService = require("../services/platformAnalyticsService");

const dashboard = asyncHandler(async (req, res) => {
    const stats = await platformAnalyticsService.getDashboardStats();
    res.status(200).json({ success: true, stats });
});

const analytics = asyncHandler(async (req, res) => {
    const series = await platformAnalyticsService.getGrowthSeries();
    res.status(200).json({ success: true, series });
});

module.exports = { dashboard, analytics };
