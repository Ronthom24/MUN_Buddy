const pool = require("../config/database");

async function create(
    { conferenceId, fullName, email, phone, passwordHash, school, grade, munExperience, profileText, specialNotes },
    db = pool
) {
    const [result] = await db.execute(
        `INSERT INTO delegates
            (conference_id, full_name, email, phone, password_hash, school, grade, mun_experience, profile_text, special_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            conferenceId, fullName, email, phone || null, passwordHash, school || null, grade || null,
            munExperience || "beginner", profileText || null, specialNotes || null
        ]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM delegates WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function findByEmail(email, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM delegates WHERE email = ? LIMIT 1`, [email]);
    return rows[0] || null;
}

async function findLatestByEmail(email, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM delegates WHERE email = ? ORDER BY created_at DESC LIMIT 1`,
        [email]
    );
    return rows[0] || null;
}

async function listByConference(conferenceId, filters = {}, db = pool) {
    const clauses = ["conference_id = ?"];
    const params = [conferenceId];

    if (filters.status) {
        clauses.push("status = ?");
        params.push(filters.status);
    }
    if (filters.munExperience) {
        clauses.push("mun_experience = ?");
        params.push(filters.munExperience);
    }
    if (filters.search) {
        clauses.push("(full_name LIKE ? OR email LIKE ? OR school LIKE ?)");
        const like = `%${filters.search}%`;
        params.push(like, like, like);
    }

    const [rows] = await db.execute(
        `SELECT * FROM delegates WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC`,
        params
    );
    return rows;
}

async function updateStatus(id, status, db = pool) {
    await db.execute(`UPDATE delegates SET status = ? WHERE id = ?`, [status, id]);
    return findById(id, db);
}

const SELF_UPDATABLE_FIELDS = { phone: "phone", school: "school", grade: "grade" };

async function updateOwnProfile(id, data, db = pool) {
    const setClauses = [];
    const params = [];

    for (const [key, column] of Object.entries(SELF_UPDATABLE_FIELDS)) {
        if (data[key] !== undefined) {
            setClauses.push(`${column} = ?`);
            params.push(data[key]);
        }
    }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE delegates SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function bulkUpdateStatus(ids, status, db = pool) {
    if (!ids.length) return [];
    await db.query(`UPDATE delegates SET status = ? WHERE id IN (?)`, [status, ids]);
    const [rows] = await db.query(`SELECT * FROM delegates WHERE id IN (?)`, [ids]);
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
        `SELECT id, LOWER(TRIM(email)) AS norm_email, TRIM(phone) AS norm_phone, LOWER(TRIM(full_name)) AS norm_name
         FROM delegates WHERE conference_id = ?`,
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

async function updatePasswordHash(id, passwordHash, db = pool) {
    await db.execute(`UPDATE delegates SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
}

async function addCommitteePreferences(delegateId, committeePreferences, db = pool) {
    for (const pref of committeePreferences || []) {
        await db.execute(
            `INSERT INTO delegate_committee_preferences (delegate_id, committee_id, preference_rank) VALUES (?, ?, ?)`,
            [delegateId, pref.committeeId, pref.rank]
        );
    }
}

async function addCountryPreferences(delegateId, countryPreferences, db = pool) {
    for (const pref of countryPreferences || []) {
        await db.execute(
            `INSERT INTO delegate_country_preferences (delegate_id, country_name, preference_rank) VALUES (?, ?, ?)`,
            [delegateId, pref.countryName, pref.rank]
        );
    }
}

async function getCommitteePreferences(delegateId, db = pool) {
    const [rows] = await db.execute(
        `SELECT dcp.preference_rank, c.id AS committee_id, c.name AS committee_name
         FROM delegate_committee_preferences dcp
         INNER JOIN committees c ON c.id = dcp.committee_id
         WHERE dcp.delegate_id = ? ORDER BY dcp.preference_rank ASC`,
        [delegateId]
    );
    return rows;
}

async function getCountryPreferences(delegateId, db = pool) {
    const [rows] = await db.execute(
        `SELECT preference_rank, country_name FROM delegate_country_preferences
         WHERE delegate_id = ? ORDER BY preference_rank ASC`,
        [delegateId]
    );
    return rows;
}

module.exports = {
    create, findById, findByEmail, findLatestByEmail, listByConference, updateStatus, bulkUpdateStatus,
    updateOwnProfile, updatePasswordHash, addCommitteePreferences, addCountryPreferences,
    getCommitteePreferences, getCountryPreferences, findPossibleDuplicateIds
};
