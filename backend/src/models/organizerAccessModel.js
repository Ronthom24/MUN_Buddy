const pool = require("../config/database");

/** `profileId` is set immediately for the conference owner's own row (their profile already exists at creation time); left null for invites until claimed. */
async function create({ conferenceId, email, profileId, role, committeeId, departmentId, positionTitle }, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO organizer_access (conference_id, invite_email, profile_id, role, committee_id, department_id, position_title)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [conferenceId, email, profileId || null, role || "organizer", committeeId || null, departmentId || null, positionTitle || null]
    );
    return rows[0].id;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM organizer_access WHERE id = $1`, [id]);
    return rows[0] || null;
}

/** LEFT JOIN profiles: unclaimed invites have no profile_id yet, so full_name/email fall back to invite_email. */
async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.execute(
        `SELECT oa.*, COALESCE(p.full_name, NULL) AS full_name, COALESCE(p.email, oa.invite_email) AS email
         FROM organizer_access oa
         LEFT JOIN profiles p ON p.id = oa.profile_id
         WHERE oa.conference_id = $1 ORDER BY oa.created_at ASC`,
        [conferenceId]
    );
    return rows;
}

/** Pre-claim invite lookup (no profile_id yet) -- used by the invite/claim flow. */
async function findByConferenceAndEmail(conferenceId, email, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM organizer_access WHERE conference_id = $1 AND invite_email = $2`,
        [conferenceId, email]
    );
    return rows[0] || null;
}

/** Post-auth lookup, keyed by the verified Supabase profile id -- what resolveConferenceAccess uses. */
async function findByConferenceAndProfile(conferenceId, profileId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM organizer_access WHERE conference_id = $1 AND profile_id = $2 AND status = 'active'`,
        [conferenceId, profileId]
    );
    return rows[0] || null;
}

/** Every claimed organizer_access row this profile can act through (all conferences). */
async function listByProfile(profileId, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM organizer_access WHERE profile_id = $1`, [profileId]);
    return rows;
}

/** Links a pending invite to the claiming profile. */
async function claimInvite(id, { profileId, positionTitle }, db = pool) {
    await db.execute(
        `UPDATE organizer_access SET profile_id = $1, position_title = COALESCE($2, position_title) WHERE id = $3`,
        [profileId, positionTitle || null, id]
    );
    return findById(id, db);
}

const UPDATABLE_FIELDS = {
    role: "role", committeeId: "committee_id", departmentId: "department_id", positionTitle: "position_title"
};

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
    await db.execute(`UPDATE organizer_access SET ${setClauses.join(", ")} WHERE id = $${i}`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM organizer_access WHERE id = $1`, [id]);
}

/**
 * Revokes every staff grant under conferences owned by this profile's
 * organization(s) (force-logout/suspend cascade -- see
 * platformUserService.suspendUser/forceLogout). Replaces the old
 * token_version-bump pattern: with Supabase Auth owning session validity,
 * conference-scoped revocation is a plain status flag checked in
 * resolveConferenceAccess, not a version counter compared on every request.
 */
async function setStatusForOwnerConferences(ownerProfileId, status, db = pool) {
    await db.execute(
        `UPDATE organizer_access
         SET status = $1
         WHERE conference_id IN (
             SELECT c.id FROM conferences c
             JOIN organization_members om ON om.organization_id = c.organization_id
             WHERE om.profile_id = $2 AND om.org_role = 'owner'
         )`,
        [status, ownerProfileId]
    );
}

module.exports = {
    create, findById, listByConference, findByConferenceAndEmail, findByConferenceAndProfile, listByProfile,
    claimInvite, update, remove, setStatusForOwnerConferences
};
