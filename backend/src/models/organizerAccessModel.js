const pool = require("../config/database");

async function create({ conferenceId, email, role, committeeId }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO organizer_access (conference_id, email, role, committee_id) VALUES (?, ?, ?, ?)`,
        [conferenceId, email, role || "organizer", committeeId || null]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM organizer_access WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM organizer_access WHERE conference_id = ? ORDER BY created_at ASC`,
        [conferenceId]
    );
    return rows;
}

async function findByConferenceAndEmail(conferenceId, email, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM organizer_access WHERE conference_id = ? AND email = ?`,
        [conferenceId, email]
    );
    return rows[0] || null;
}

async function listClaimedByEmail(email, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM organizer_access WHERE email = ? AND password_hash IS NOT NULL`,
        [email]
    );
    return rows;
}

async function setPassword(id, { passwordHash, fullName }, db = pool) {
    await db.execute(
        `UPDATE organizer_access SET password_hash = ?, full_name = ? WHERE id = ?`,
        [passwordHash, fullName || null, id]
    );
    return findById(id, db);
}

async function updatePasswordHash(id, passwordHash, db = pool) {
    await db.execute(`UPDATE organizer_access SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
}

const UPDATABLE_FIELDS = { role: "role", committeeId: "committee_id" };

async function update(id, data, db = pool) {
    const setClauses = [];
    const params = [];

    for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
        if (data[key] !== undefined) {
            setClauses.push(`${column} = ?`);
            params.push(data[key]);
        }
    }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE organizer_access SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM organizer_access WHERE id = ?`, [id]);
}

module.exports = {
    create, findById, listByConference, findByConferenceAndEmail, listClaimedByEmail,
    setPassword, updatePasswordHash, update, remove
};
