const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");
const loginHistoryService = require("../services/loginHistoryService");
const organizerModel = require("../models/organizerModel");
const delegateModel = require("../models/delegateModel");

/**
 * Records spec 22.17's Login History regardless of outcome. Session
 * management itself stays short-lived-JWT-only by design (see
 * docs/Architecture.md) -- this is the audit trail, not a session store.
 */
async function recordLogin(req, { userType, userId, email, success }) {
    await loginHistoryService.record({
        userType, userId, email, success,
        ipAddress: req.ip, userAgent: req.headers["user-agent"]
    });
}

const organizerRegister = asyncHandler(async (req, res) => {
    const result = await authService.organizerRegister(req.body);
    res.status(201).json({ success: true, ...result });
});

const organizerLogin = asyncHandler(async (req, res) => {
    try {
        const result = await authService.organizerLogin(req.body);
        await recordLogin(req, { userType: "organizer", userId: result.organizer.id, email: req.body.email, success: true });
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        const organizer = await organizerModel.findByEmail(req.body.email);
        await recordLogin(req, { userType: "organizer", userId: organizer?.id || null, email: req.body.email, success: false });
        throw err;
    }
});

const delegateRegister = asyncHandler(async (req, res) => {
    const result = await authService.delegateRegister(req.body);
    res.status(201).json({ success: true, ...result });
});

const delegateLogin = asyncHandler(async (req, res) => {
    try {
        const result = await authService.delegateLogin(req.body);
        await recordLogin(req, { userType: "delegate", userId: result.delegate.id, email: req.body.email, success: true });
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        const delegate = await delegateModel.findLatestByEmail(req.body.email);
        await recordLogin(req, { userType: "delegate", userId: delegate?.id || null, email: req.body.email, success: false });
        throw err;
    }
});

const organizerAccessClaim = asyncHandler(async (req, res) => {
    const result = await authService.organizerAccessClaim(req.body);
    res.status(201).json({ success: true, ...result });
});

const myLoginHistory = asyncHandler(async (req, res) => {
    const history = await loginHistoryService.listForUser(req.user.role, req.user.id);
    res.status(200).json({ success: true, history });
});

const passwordResetRequest = asyncHandler(async (req, res) => {
    const result = await authService.requestPasswordReset(req.body);
    res.status(200).json({ success: true, ...result });
});

const passwordResetConfirm = asyncHandler(async (req, res) => {
    const result = await authService.confirmPasswordReset(req.body);
    res.status(200).json({ success: true, ...result });
});

const verifyEmail = asyncHandler(async (req, res) => {
    const result = await authService.verifyEmail(req.body);
    res.status(200).json({ success: true, ...result });
});

const resendVerification = asyncHandler(async (req, res) => {
    const result = await authService.resendVerificationEmail(req.body);
    res.status(200).json({ success: true, ...result });
});

module.exports = {
    organizerRegister, organizerLogin, delegateRegister, delegateLogin,
    organizerAccessClaim, passwordResetRequest, passwordResetConfirm, myLoginHistory,
    verifyEmail, resendVerification
};
