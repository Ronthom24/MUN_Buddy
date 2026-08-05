const asyncHandler = require("../utils/asyncHandler");
const platformAuthService = require("../services/platformAuthService");
const loginHistoryService = require("../services/loginHistoryService");
const platformAdminModel = require("../models/platformAdminModel");

async function recordLogin(req, { userId, email, success }) {
    await loginHistoryService.record({
        userType: "platform_admin", userId, email, success,
        ipAddress: req.ip, userAgent: req.headers["user-agent"]
    });
}

const login = asyncHandler(async (req, res) => {
    await loginHistoryService.assertNotLocked(req.body.email);
    try {
        const result = await platformAuthService.login(req.body);
        await recordLogin(req, { userId: result.admin.id, email: req.body.email, success: true });
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        await recordLogin(req, { userId: null, email: req.body.email, success: false });
        throw err;
    }
});

const me = asyncHandler(async (req, res) => {
    const admin = await platformAdminModel.findByProfileId(req.platformAdmin.id);
    res.status(200).json({ success: true, admin: { id: admin.profile_id, name: admin.name, email: admin.email, lastLogin: admin.last_login } });
});

module.exports = { login, me };
