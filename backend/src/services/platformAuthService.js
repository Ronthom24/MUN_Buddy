const ApiError = require("../utils/ApiError");
const platformAdminModel = require("../models/platformAdminModel");
const { authClient } = require("../utils/supabaseClients");

/**
 * Backend-mediated, like organizer/delegate login (see authService.js) --
 * keeps login_history/lockout enforcement working, and platform admin now
 * shares the same Supabase Auth identity/token realm as everyone else
 * instead of a separate PLATFORM_JWT_SECRET-signed token. "Is this profile
 * a platform admin" is just a flag-table check (platformAdminModel), not a
 * credential.
 */
async function login({ email, password }) {
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });
    if (error) throw new ApiError(401, "Invalid email or password");

    const isAdmin = await platformAdminModel.isPlatformAdmin(data.user.id);
    if (!isAdmin) throw new ApiError(403, "This account doesn't have platform administrator access.");

    await platformAdminModel.touchLastLogin(data.user.id);

    return {
        token: data.session.access_token,
        admin: { id: data.user.id, name: data.user.user_metadata?.full_name, email: data.user.email }
    };
}

module.exports = { login };
