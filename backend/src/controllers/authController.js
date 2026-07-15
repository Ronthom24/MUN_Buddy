const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");

const organizerRegister = asyncHandler(async (req, res) => {
    const result = await authService.organizerRegister(req.body);
    res.status(201).json({ success: true, ...result });
});

const organizerLogin = asyncHandler(async (req, res) => {
    const result = await authService.organizerLogin(req.body);
    res.status(200).json({ success: true, ...result });
});

const delegateRegister = asyncHandler(async (req, res) => {
    const result = await authService.delegateRegister(req.body);
    res.status(201).json({ success: true, ...result });
});

const delegateLogin = asyncHandler(async (req, res) => {
    const result = await authService.delegateLogin(req.body);
    res.status(200).json({ success: true, ...result });
});

const organizerAccessClaim = asyncHandler(async (req, res) => {
    const result = await authService.organizerAccessClaim(req.body);
    res.status(201).json({ success: true, ...result });
});

const passwordResetRequest = asyncHandler(async (req, res) => {
    const result = await authService.requestPasswordReset(req.body);
    res.status(200).json({ success: true, ...result });
});

const passwordResetConfirm = asyncHandler(async (req, res) => {
    const result = await authService.confirmPasswordReset(req.body);
    res.status(200).json({ success: true, ...result });
});

module.exports = {
    organizerRegister, organizerLogin, delegateRegister, delegateLogin,
    organizerAccessClaim, passwordResetRequest, passwordResetConfirm
};
