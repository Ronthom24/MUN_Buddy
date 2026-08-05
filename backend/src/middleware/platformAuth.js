const { verifySupabaseToken } = require("../utils/supabaseAuth");
const ApiError = require("../utils/ApiError");
const platformAdminModel = require("../models/platformAdminModel");

async function platformAuthenticate(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return next(new ApiError(401, "Missing or invalid Authorization header"));
    }

    try {
        const payload = await verifySupabaseToken(token);
        const isAdmin = await platformAdminModel.isPlatformAdmin(payload.sub);
        if (!isAdmin) {
            return next(new ApiError(403, "This endpoint requires platform administrator access"));
        }
        req.platformAdmin = { id: payload.sub, email: payload.email, name: payload.user_metadata?.full_name || null };
        next();
    } catch (err) {
        next(new ApiError(401, "Invalid or expired token"));
    }
}

module.exports = { platformAuthenticate };
