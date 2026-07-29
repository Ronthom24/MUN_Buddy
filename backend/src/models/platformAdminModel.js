const pool = require("../config/database");

// Flag table now, not a credential store -- identity/name/email/password
// live in Supabase Auth via profiles. Every read joins profiles for display.
const SELECT_WITH_PROFILE = `
    SELECT pa.profile_id, pa.last_login, pa.created_at, p.full_name AS name, p.email
    FROM platform_admins pa
    JOIN profiles p ON p.id = pa.profile_id
`;

async function create(profileId, db = pool) {
    await db.execute(
        `INSERT INTO platform_admins (profile_id) VALUES ($1) ON CONFLICT (profile_id) DO NOTHING`,
        [profileId]
    );
    return profileId;
}

async function findByProfileId(profileId, db = pool) {
    const [rows] = await db.execute(`${SELECT_WITH_PROFILE} WHERE pa.profile_id = $1`, [profileId]);
    return rows[0] || null;
}

async function isPlatformAdmin(profileId, db = pool) {
    const [rows] = await db.execute(`SELECT 1 FROM platform_admins WHERE profile_id = $1`, [profileId]);
    return rows.length > 0;
}

async function touchLastLogin(profileId, db = pool) {
    await db.execute(`UPDATE platform_admins SET last_login = now() WHERE profile_id = $1`, [profileId]);
}

module.exports = { create, findByProfileId, isPlatformAdmin, touchLastLogin };
