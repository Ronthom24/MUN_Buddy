const pool = require("../config/database");

async function listAll(db = pool) {
    const [rows] = await db.execute(`SELECT key, label, module FROM permissions ORDER BY module, key`);
    return rows;
}

async function listDefaultsForRole(role, db = pool) {
    const [rows] = await db.execute(`SELECT permission_key FROM role_permissions WHERE role = $1`, [role]);
    return rows.map((row) => row.permission_key);
}

async function listOverridesForAccess(organizerAccessId, db = pool) {
    const [rows] = await db.execute(
        `SELECT permission_key, granted FROM organizer_access_permission_overrides WHERE organizer_access_id = $1`,
        [organizerAccessId]
    );
    return rows;
}

/**
 * Effective permission set for a given organizer_access row: role defaults,
 * with any per-member overrides applied on top (granted=1 adds, granted=0
 * revokes even if the role would otherwise include it).
 */
async function getEffectivePermissions(role, organizerAccessId, db = pool) {
    const defaults = new Set(await listDefaultsForRole(role, db));

    if (organizerAccessId) {
        const overrides = await listOverridesForAccess(organizerAccessId, db);
        for (const override of overrides) {
            if (override.granted) defaults.add(override.permission_key);
            else defaults.delete(override.permission_key);
        }
    }

    return defaults;
}

async function hasPermission(role, organizerAccessId, permissionKey, db = pool) {
    const effective = await getEffectivePermissions(role, organizerAccessId, db);
    return effective.has(permissionKey);
}

async function setOverride(organizerAccessId, permissionKey, granted, db = pool) {
    await db.execute(
        `INSERT INTO organizer_access_permission_overrides (organizer_access_id, permission_key, granted)
         VALUES ($1, $2, $3)
         ON CONFLICT (organizer_access_id, permission_key) DO UPDATE SET granted = EXCLUDED.granted`,
        [organizerAccessId, permissionKey, granted]
    );
}

async function clearOverride(organizerAccessId, permissionKey, db = pool) {
    await db.execute(
        `DELETE FROM organizer_access_permission_overrides WHERE organizer_access_id = $1 AND permission_key = $2`,
        [organizerAccessId, permissionKey]
    );
}

module.exports = {
    listAll, listDefaultsForRole, listOverridesForAccess, getEffectivePermissions, hasPermission,
    setOverride, clearOverride
};
