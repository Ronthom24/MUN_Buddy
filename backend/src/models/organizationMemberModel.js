const pool = require("../config/database");

/**
 * `profileId` is set immediately for the owner row (created right after the
 * founder's own Supabase sign-up, so their profile already exists) but left
 * null for invited members until they claim the invite -- same pre/post-claim
 * shape as organizer_access.
 */
async function create({ organizationId, email, profileId, fullName, orgRole, status, invitedBy }, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO organization_members (organization_id, invite_email, profile_id, org_role, status, invited_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [organizationId, email, profileId || null, orgRole || "member", status || "active", invitedBy || null]
    );
    return rows[0].id;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM organization_members WHERE id = $1`, [id]);
    return rows[0] || null;
}

/** Pre-claim invite lookup. */
async function findByOrganizationAndEmail(organizationId, email, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM organization_members WHERE organization_id = $1 AND invite_email = $2`,
        [organizationId, email]
    );
    return rows[0] || null;
}

/** Post-auth lookup, keyed by the verified Supabase profile id. */
async function findByOrganizationAndProfile(organizationId, profileId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM organization_members WHERE organization_id = $1 AND profile_id = $2`,
        [organizationId, profileId]
    );
    return rows[0] || null;
}

async function listByOrganization(organizationId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM organization_members WHERE organization_id = $1 ORDER BY created_at ASC`,
        [organizationId]
    );
    return rows;
}

async function claimInvite(id, profileId, db = pool) {
    await db.execute(`UPDATE organization_members SET profile_id = $1 WHERE id = $2`, [profileId, id]);
    return findById(id, db);
}

async function update(id, { orgRole, status }, db = pool) {
    const setClauses = [];
    const params = [];
    let i = 1;

    if (orgRole !== undefined) {
        setClauses.push(`org_role = $${i++}`);
        params.push(orgRole);
    }
    if (status !== undefined) {
        setClauses.push(`status = $${i++}`);
        params.push(status);
    }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE organization_members SET ${setClauses.join(", ")} WHERE id = $${i}`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM organization_members WHERE id = $1`, [id]);
}

module.exports = {
    create, findById, findByOrganizationAndEmail, findByOrganizationAndProfile, listByOrganization,
    claimInvite, update, remove
};
