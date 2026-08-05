const pool = require("../config/database");
const ApiError = require("../utils/ApiError");
const organizerAccessModel = require("../models/organizerAccessModel");
const profileModel = require("../models/profileModel");
const delegateModel = require("../models/delegateModel");
const { adminClient } = require("../utils/supabaseClients");

/**
 * "Users" (spec ch.10) unions organizers + delegates. Organizers are now
 * profiles with at least one organization ownership -- organizer_access
 * rows are role grants, not distinct people, same reasoning as before the
 * identity migration; a profile with the same email can't appear twice here
 * even if it owns several organizations, since this dedupes by profile id.
 */
async function listUsers({ search, type, status } = {}, db = pool) {
    const queries = [];
    const unionParams = [];
    let i = 1;

    if (!type || type === "organizer") {
        const clauses = [
            `EXISTS (SELECT 1 FROM organization_members om WHERE om.profile_id = p.id AND om.org_role = 'owner' AND om.status = 'active')`
        ];
        if (search) {
            clauses.push(`(p.full_name ILIKE $${i} OR p.email ILIKE $${i})`);
            unionParams.push(`%${search}%`);
            i++;
        }
        if (status) {
            clauses.push(`p.status = $${i++}`);
            unionParams.push(status);
        }
        queries.push(
            `SELECT p.id, 'organizer' AS user_type, p.full_name, p.email, p.status AS account_status,
                    p.suspended_at, NULL::bigint AS conference_id, p.created_at
             FROM profiles p WHERE ${clauses.join(" AND ")}`
        );
    }
    if (!type || type === "delegate") {
        const clauses = ["1=1"];
        if (search) {
            clauses.push(`(p.full_name ILIKE $${i} OR p.email ILIKE $${i})`);
            unionParams.push(`%${search}%`);
            i++;
        }
        if (status) {
            clauses.push(`d.account_status = $${i++}`);
            unionParams.push(status);
        }
        queries.push(
            `SELECT d.id, 'delegate' AS user_type, p.full_name, p.email, d.account_status,
                    d.suspended_at, d.conference_id, d.created_at
             FROM delegates d JOIN profiles p ON p.id = d.profile_id WHERE ${clauses.join(" AND ")}`
        );
    }

    if (queries.length === 0) return [];

    const [rows] = await db.query(`${queries.join(" UNION ALL ")} ORDER BY created_at DESC`, unionParams);
    return rows;
}

/**
 * Immediate, real enforcement is the DB flag: organizer_access.status /
 * delegates.account_status is checked on every conference-scoped request
 * (resolveConferenceAccess / the delegate login-account_status check), and
 * profiles.sessions_revoked_at kills the organizer's own existing session
 * on their very next request (see middleware/auth.js) -- so a suspended
 * person is locked out of actually doing anything within seconds,
 * regardless of their current access token's remaining lifetime.
 *
 * The Supabase ban (organizer only, global across the whole platform) is
 * additionally used to stop them from getting a *new* session while
 * suspended. Delegate suspension stays conference-scoped and never bans the
 * underlying Supabase account, since one profile's delegate application to
 * conference A being suspended must not block their organizer capacity or
 * their application to conference B.
 */
async function suspendUser(userType, id, reason, db = pool) {
    if (userType === "organizer") {
        const profile = await profileModel.setStatus(id, "suspended", reason, db);
        if (!profile) throw new ApiError(404, "Organizer not found");
        await organizerAccessModel.setStatusForOwnerConferences(id, "revoked", db);
        await profileModel.touchSessionRevocation(id, db);
        await adminClient.auth.admin.updateUserById(id, { ban_duration: "87600h" });
    } else if (userType === "delegate") {
        const delegate = await delegateModel.findById(id, db);
        if (!delegate) throw new ApiError(404, "Delegate not found");
        await db.execute(
            `UPDATE delegates SET account_status = 'suspended', suspended_at = now() WHERE id = $1`,
            [id]
        );
    } else {
        throw new ApiError(400, "userType must be 'organizer' or 'delegate'");
    }
}

async function activateUser(userType, id, db = pool) {
    if (userType === "organizer") {
        const profile = await profileModel.setStatus(id, "active", null, db);
        if (!profile) throw new ApiError(404, "Organizer not found");
        await organizerAccessModel.setStatusForOwnerConferences(id, "active", db);
        await adminClient.auth.admin.updateUserById(id, { ban_duration: "none" });
    } else if (userType === "delegate") {
        const delegate = await delegateModel.findById(id, db);
        if (!delegate) throw new ApiError(404, "Delegate not found");
        await db.execute(`UPDATE delegates SET account_status = 'active', suspended_at = NULL WHERE id = $1`, [id]);
    } else {
        throw new ApiError(400, "userType must be 'organizer' or 'delegate'");
    }
}

/** "Force logout" (spec ch.13): kills the existing session(s) without changing suspend status -- see the enforcement note above and profiles.sessions_revoked_at. */
async function forceLogout(userType, id, db = pool) {
    if (userType === "organizer") {
        const profile = await profileModel.findById(id, db);
        if (!profile) throw new ApiError(404, "Organizer not found");
        await profileModel.touchSessionRevocation(id, db);
    } else if (userType === "delegate") {
        const delegate = await delegateModel.findById(id, db);
        if (!delegate) throw new ApiError(404, "Delegate not found");
        await profileModel.touchSessionRevocation(delegate.profile_id, db);
    } else {
        throw new ApiError(400, "userType must be 'organizer' or 'delegate'");
    }
}

module.exports = { listUsers, suspendUser, activateUser, forceLogout };
