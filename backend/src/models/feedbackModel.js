const pool = require("../config/database");

async function create({ conferenceId, delegateId, rating, category, comments }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO feedback (conference_id, delegate_id, rating, category, comments)
         VALUES (?, ?, ?, ?, ?)`,
        [conferenceId, delegateId, rating || null, category || "general", comments]
    );
    return result.insertId;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT f.*, d.full_name AS delegate_name
         FROM feedback f
         INNER JOIN delegates d ON d.id = f.delegate_id
         WHERE f.conference_id = ?
         ORDER BY f.created_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM feedback WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM feedback WHERE id = ?`, [id]);
}

module.exports = { create, listByConference, findById, remove };
