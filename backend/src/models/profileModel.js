const pool = require("../config/database");

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM profiles WHERE id = $1`, [id]);
    return rows[0] || null;
}

async function findByEmail(email, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM profiles WHERE email = $1`, [email]);
    return rows[0] || null;
}

const UPDATABLE_FIELDS = { fullName: "full_name", phone: "phone" };

async function update(id, data, db = pool) {
    const setClauses = [];
    const params = [];
    let i = 1;

    for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
        if (data[key] !== undefined) {
            setClauses.push(`${column} = $${i++}`);
            params.push(data[key]);
        }
    }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE profiles SET ${setClauses.join(", ")} WHERE id = $${i}`, params);
    return findById(id, db);
}

/**
 * "Suspend this organizer" (Platform Administration, spec ch.13) now means
 * suspending their platform-wide organizer capacity here, since organizers
 * are just profiles -- checked in authService.assertOwningOrganizerNotSuspended
 * and (defense-in-depth) at login. Delegate-side suspension stays separate
 * and conference-scoped on delegates.account_status.
 */
async function setStatus(id, status, reason, db = pool) {
    await db.execute(
        `UPDATE profiles SET status = $1, suspended_at = CASE WHEN $1 = 'suspended' THEN now() ELSE NULL END,
            suspended_reason = CASE WHEN $1 = 'suspended' THEN $2 ELSE NULL END
         WHERE id = $3`,
        [status, reason || null, id]
    );
    return findById(id, db);
}

/** Real force-logout: see database/schema-postgres/09_profile_session_revocation.sql. */
async function touchSessionRevocation(id, db = pool) {
    await db.execute(`UPDATE profiles SET sessions_revoked_at = now() WHERE id = $1`, [id]);
}

module.exports = { findById, findByEmail, update, setStatus, touchSessionRevocation };
