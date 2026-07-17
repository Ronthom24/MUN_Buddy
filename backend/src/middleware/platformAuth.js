const platformJwt = require("../utils/platformJwt");
const ApiError = require("../utils/ApiError");

function platformAuthenticate(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return next(new ApiError(401, "Missing or invalid Authorization header"));
    }

    try {
        const decoded = platformJwt.verifyToken(token);
        if (decoded.role !== "platform_admin") {
            return next(new ApiError(403, "This endpoint requires platform administrator access"));
        }
        req.platformAdmin = decoded;
        next();
    } catch (err) {
        next(new ApiError(401, "Invalid or expired token"));
    }
}

module.exports = { platformAuthenticate };
