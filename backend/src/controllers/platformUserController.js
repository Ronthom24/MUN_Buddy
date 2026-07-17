const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const platformUserService = require("../services/platformUserService");

const list = asyncHandler(async (req, res) => {
    const users = await platformUserService.listUsers({
        search: req.query.search, type: req.query.type, status: req.query.status
    });
    res.status(200).json({ success: true, users });
});

function validateType(type) {
    if (!["organizer", "delegate"].includes(type)) {
        throw new ApiError(400, "type must be 'organizer' or 'delegate'");
    }
}

const suspend = asyncHandler(async (req, res) => {
    validateType(req.params.type);
    await platformUserService.suspendUser(req.params.type, Number(req.params.id), req.body.reason);
    res.status(200).json({ success: true, message: "User suspended" });
});

const activate = asyncHandler(async (req, res) => {
    validateType(req.params.type);
    await platformUserService.activateUser(req.params.type, Number(req.params.id));
    res.status(200).json({ success: true, message: "User activated" });
});

const forceLogout = asyncHandler(async (req, res) => {
    validateType(req.params.type);
    await platformUserService.forceLogout(req.params.type, Number(req.params.id));
    res.status(200).json({ success: true, message: "Sessions revoked" });
});

module.exports = { list, suspend, activate, forceLogout };
