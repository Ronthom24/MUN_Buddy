const asyncHandler = require("../utils/asyncHandler");
const platformSettingsModel = require("../models/platformSettingsModel");
const maintenanceMode = require("../middleware/maintenanceMode");

const EDITABLE_KEYS = ["platform_name", "platform_logo_path", "maintenance_mode", "default_timezone"];

const getSettings = asyncHandler(async (req, res) => {
    const settings = await platformSettingsModel.getAll();
    res.status(200).json({ success: true, settings });
});

const updateSettings = asyncHandler(async (req, res) => {
    const entries = {};
    for (const key of EDITABLE_KEYS) {
        if (req.body[key] !== undefined) entries[key] = String(req.body[key]);
    }
    await platformSettingsModel.setMany(entries);
    if (entries.maintenance_mode !== undefined) maintenanceMode.invalidate();

    const settings = await platformSettingsModel.getAll();
    res.status(200).json({ success: true, settings });
});

module.exports = { getSettings, updateSettings };
