const pool = require("../config/database");

async function create({ conferenceId, delegateId, rating, category, comments }, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO feedback (conference_id, delegate_id, rating, category, comments)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [conferenceId, delegateId, rating || null, category || "general", comments]
    );
    return rows[0].id;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT f.*, pr.full_name AS delegate_name
         FROM feedback f
         INNER JOIN delegates d ON d.id = f.delegate_id
         JOIN profiles pr ON pr.id = d.profile_id
         WHERE f.conference_id = $1
         ORDER BY f.created_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM feedback WHERE id = $1`, [id]);
    return rows[0] || null;
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM feedback WHERE id = $1`, [id]);
}

module.exports = { create, listByConference, findById, remove };
