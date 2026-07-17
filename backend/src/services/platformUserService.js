const pool = require("../config/database");
const ApiError = require("../utils/ApiError");
const organizerAccessModel = require("../models/organizerAccessModel");

/**
 * "Users" (spec ch.10) unions organizers + delegates only. organizer_access
 * rows are role grants, not distinct people -- the identity already lives in
 * `organizers`; listing a grant as a third pseudo-user would make "suspend"
 * ambiguous (suspend the grant, or the person?). Grants are surfaced on the
 * organizer's own detail view instead, not here.
 */
function buildUserClauses({ search, status }, statusColumn) {
    const clauses = [];
    const params = [];
    if (search) {
        clauses.push("(full_name LIKE ? OR email LIKE ?)");
        const like = `%${search}%`;
        params.push(like, like);
    }
    if (status) {
        clauses.push(`${statusColumn} = ?`);
        params.push(status);
    }
    return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}

async function listUsers({ search, type, status } = {}, db = pool) {
    const queries = [];
    const unionParams = [];

    if (!type || type === "organizer") {
        const { where, params } = buildUserClauses({ search, status }, "status");
        queries.push(
            `SELECT id, 'organizer' AS user_type, full_name, email, status AS account_status,
                    suspended_at, NULL AS conference_id, created_at
             FROM organizers ${where}`
        );
        unionParams.push(...params);
    }
    if (!type || type === "delegate") {
        const { where, params } = buildUserClauses({ search, status }, "account_status");
        queries.push(
            `SELECT id, 'delegate' AS user_type, full_name, email, account_status,
                    suspended_at, conference_id, created_at
             FROM delegates ${where}`
        );
        unionParams.push(...params);
    }

    if (queries.length === 0) return [];

    const [rows] = await db.query(`${queries.join(" UNION ALL ")} ORDER BY created_at DESC`, unionParams);
    return rows;
}

async function suspendUser(userType, id, reason, db = pool) {
    if (userType === "organizer") {
        const [result] = await db.execute(
            `UPDATE organizers SET status = 'suspended', suspended_at = NOW(), suspended_reason = ?,
                token_version = token_version + 1 WHERE id = ?`,
            [reason || null, id]
        );
        if (result.affectedRows === 0) throw new ApiError(404, "Organizer not found");
        // Suspending the owner must also revoke every staff member they invited
        // (organizer_access) -- see checkTokenVersion (middleware/auth.js).
        await organizerAccessModel.bumpTokenVersionForOwner(id, db);
    } else if (userType === "delegate") {
        const [result] = await db.execute(
            `UPDATE delegates SET account_status = 'suspended', suspended_at = NOW(),
                token_version = token_version + 1 WHERE id = ?`,
            [id]
        );
        if (result.affectedRows === 0) throw new ApiError(404, "Delegate not found");
    } else {
        throw new ApiError(400, "userType must be 'organizer' or 'delegate'");
    }
}

async function activateUser(userType, id, db = pool) {
    if (userType === "organizer") {
        const [result] = await db.execute(
            `UPDATE organizers SET status = 'active', suspended_at = NULL, suspended_reason = NULL WHERE id = ?`,
            [id]
        );
        if (result.affectedRows === 0) throw new ApiError(404, "Organizer not found");
    } else if (userType === "delegate") {
        const [result] = await db.execute(
            `UPDATE delegates SET account_status = 'active', suspended_at = NULL WHERE id = ?`,
            [id]
        );
        if (result.affectedRows === 0) throw new ApiError(404, "Delegate not found");
    } else {
        throw new ApiError(400, "userType must be 'organizer' or 'delegate'");
    }
}

/** "Force logout" (spec ch.13): bump token_version without changing status. */
async function forceLogout(userType, id, db = pool) {
    if (userType === "organizer") {
        const [result] = await db.execute(`UPDATE organizers SET token_version = token_version + 1 WHERE id = ?`, [id]);
        if (result.affectedRows === 0) throw new ApiError(404, "Organizer not found");
        await organizerAccessModel.bumpTokenVersionForOwner(id, db);
    } else if (userType === "delegate") {
        const [result] = await db.execute(`UPDATE delegates SET token_version = token_version + 1 WHERE id = ?`, [id]);
        if (result.affectedRows === 0) throw new ApiError(404, "Delegate not found");
    } else {
        throw new ApiError(400, "userType must be 'organizer' or 'delegate'");
    }
}

module.exports = { listUsers, suspendUser, activateUser, forceLogout };
