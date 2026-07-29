const pool = require("../config/database");

// Display fields (full_name, email, phone) now live on `profiles`, not
// `delegates` -- every read joins profiles. `phone` moved off this table
// entirely (it's identity-level, not per-conference); update it via
// profileModel instead of delegateModel.updateOwnProfile.
const SELECT_WITH_PROFILE = `
    SELECT d.*, p.full_name, p.email, p.phone
    FROM delegates d
    JOIN profiles p ON p.id = d.profile_id
`;

async function create(
    { conferenceId, profileId, school, grade, munExperience, profileText, specialNotes },
    db = pool
) {
    const [rows] = await db.execute(
        `INSERT INTO delegates
            (conference_id, profile_id, school, grade, mun_experience, profile_text, special_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
            conferenceId, profileId, school || null, grade || null,
            munExperience || "beginner", profileText || null, specialNotes || null
        ]
    );
    return rows[0].id;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`${SELECT_WITH_PROFILE} WHERE d.id = $1`, [id]);
    return rows[0] || null;
}

/** The delegate row (if any) this profile holds for a specific conference. */
async function findByConferenceAndProfile(conferenceId, profileId, db = pool) {
    const [rows] = await db.execute(
        `${SELECT_WITH_PROFILE} WHERE d.conference_id = $1 AND d.profile_id = $2`,
        [conferenceId, profileId]
    );
    return rows[0] || null;
}

/** Every conference this profile has applied to as a delegate. */
async function listByProfile(profileId, db = pool) {
    const [rows] = await db.execute(`${SELECT_WITH_PROFILE} WHERE d.profile_id = $1 ORDER BY d.created_at DESC`, [profileId]);
    return rows;
}

async function listByConference(conferenceId, filters = {}, db = pool) {
    const clauses = ["d.conference_id = $1"];
    const params = [conferenceId];
    let i = 2;

    if (filters.status) {
        clauses.push(`d.status = $${i++}`);
        params.push(filters.status);
    }
    if (filters.munExperience) {
        clauses.push(`d.mun_experience = $${i++}`);
        params.push(filters.munExperience);
    }
    if (filters.search) {
        clauses.push(`(p.full_name ILIKE $${i} OR p.email ILIKE $${i} OR d.school ILIKE $${i})`);
        params.push(`%${filters.search}%`);
        i++;
    }

    const [rows] = await db.execute(
        `${SELECT_WITH_PROFILE} WHERE ${clauses.join(" AND ")} ORDER BY d.created_at DESC`,
        params
    );
    return rows;
}

async function updateStatus(id, status, db = pool) {
    await db.execute(`UPDATE delegates SET status = $1 WHERE id = $2`, [status, id]);
    return findById(id, db);
}

const SELF_UPDATABLE_FIELDS = { school: "school", grade: "grade" };

async function updateOwnProfile(id, data, db = pool) {
    const setClauses = [];
    const params = [];
    let i = 1;

    for (const [key, column] of Object.entries(SELF_UPDATABLE_FIELDS)) {
        if (data[key] !== undefined) {
            setClauses.push(`${column} = $${i++}`);
            params.push(data[key]);
        }
    }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE delegates SET ${setClauses.join(", ")} WHERE id = $${i}`, params);
    return findById(id, db);
}

async function bulkUpdateStatus(ids, status, db = pool) {
    if (!ids.length) return [];
    await db.query(`UPDATE delegates SET status = $1 WHERE id = ANY($2::bigint[])`, [status, ids]);
    const [rows] = await db.query(`${SELECT_WITH_PROFILE} WHERE d.id = ANY($1::bigint[])`, [ids]);
    return rows;
}

/**
 * Groups delegates in a conference by normalized email/phone/name so
 * organizers can spot likely duplicate registrations before approving them
 * (spec 11.16). Returns a Set of delegate ids that share an email, phone, or
 * full name with at least one other delegate in the same conference.
 */
async function findPossibleDuplicateIds(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT d.id, LOWER(TRIM(p.email)) AS norm_email, TRIM(p.phone) AS norm_phone, LOWER(TRIM(p.full_name)) AS norm_name
         FROM delegates d JOIN profiles p ON p.id = d.profile_id
         WHERE d.conference_id = $1`,
        [conferenceId]
    );

    const byEmail = new Map();
    const byPhone = new Map();
    const byName = new Map();
    for (const row of rows) {
        if (row.norm_email) byEmail.set(row.norm_email, (byEmail.get(row.norm_email) || []).concat(row.id));
        if (row.norm_phone) byPhone.set(row.norm_phone, (byPhone.get(row.norm_phone) || []).concat(row.id));
        if (row.norm_name) byName.set(row.norm_name, (byName.get(row.norm_name) || []).concat(row.id));
    }

    const duplicateIds = new Set();
    for (const group of [...byEmail.values(), ...byPhone.values(), ...byName.values()]) {
        if (group.length > 1) group.forEach((id) => duplicateIds.add(id));
    }
    return duplicateIds;
}

async function addCommitteePreferences(delegateId, committeePreferences, db = pool) {
    for (const pref of committeePreferences || []) {
        await db.execute(
            `INSERT INTO delegate_committee_preferences (delegate_id, committee_id, preference_rank) VALUES ($1, $2, $3)`,
            [delegateId, pref.committeeId, pref.rank]
        );
    }
}

async function addCountryPreferences(delegateId, countryPreferences, db = pool) {
    for (const pref of countryPreferences || []) {
        await db.execute(
            `INSERT INTO delegate_country_preferences (delegate_id, country_name, preference_rank) VALUES ($1, $2, $3)`,
            [delegateId, pref.countryName, pref.rank]
        );
    }
}

async function getCommitteePreferences(delegateId, db = pool) {
    const [rows] = await db.execute(
        `SELECT dcp.preference_rank, c.id AS committee_id, c.name AS committee_name
         FROM delegate_committee_preferences dcp
         INNER JOIN committees c ON c.id = dcp.committee_id
         WHERE dcp.delegate_id = $1 ORDER BY dcp.preference_rank ASC`,
        [delegateId]
    );
    return rows;
}

async function getCountryPreferences(delegateId, db = pool) {
    const [rows] = await db.execute(
        `SELECT preference_rank, country_name FROM delegate_country_preferences
         WHERE delegate_id = $1 ORDER BY preference_rank ASC`,
        [delegateId]
    );
    return rows;
}

module.exports = {
    create, findById, findByConferenceAndProfile, listByProfile, listByConference, updateStatus, bulkUpdateStatus,
    updateOwnProfile, addCommitteePreferences, addCountryPreferences,
    getCommitteePreferences, getCountryPreferences, findPossibleDuplicateIds
};
