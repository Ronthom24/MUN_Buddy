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

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM delegates WHERE conference_id = ? ORDER BY created_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function updateStatus(id, status, db = pool) {
    await db.execute(`UPDATE delegates SET status = ? WHERE id = ?`, [status, id]);
    return findById(id, db);
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
    create, findById, findByEmail, findLatestByEmail, listByConference, updateStatus, updatePasswordHash,
    addCommitteePreferences, addCountryPreferences, getCommitteePreferences, getCountryPreferences
};
