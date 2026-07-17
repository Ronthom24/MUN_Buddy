const platformSettingsModel = require("../models/platformSettingsModel");

// Lazily-cached flag so normal requests don't hit the DB every time. The
// platform settings controller calls invalidate() after any settings write,
// so a maintenance-mode toggle takes effect on the very next request.
let cached = null;

async function isMaintenanceMode() {
    if (cached === null) {
        const value = await platformSettingsModel.get("maintenance_mode");
        cached = value === "true";
    }
    return cached;
}

function invalidate() {
    cached = null;
}

async function maintenanceMode(req, res, next) {
    if (req.path.startsWith("/api/platform") || req.path === "/health") return next();

    try {
        if (await isMaintenanceMode()) {
            return res.status(503).json({
                success: false,
                message: "MUN Buddy is temporarily down for maintenance. Please check back shortly."
            });
        }
        next();
    } catch (err) {
        // If the settings table isn't reachable/seeded yet, fail open rather
        // than taking the whole platform down over a missing row.
        next();
    }
}

module.exports = { maintenanceMode, invalidate };
