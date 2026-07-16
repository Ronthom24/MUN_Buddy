const pool = require("../config/database");

async function create({ conferenceId, name, description }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO departments (conference_id, name, description) VALUES (?, ?, ?)`,
        [conferenceId, name, description || null]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM departments WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT d.*, (SELECT COUNT(*) FROM organizer_access a WHERE a.department_id = d.id) AS member_count
         FROM departments d WHERE d.conference_id = ? ORDER BY d.name ASC`,
        [conferenceId]
    );
    return rows;
}

async function update(id, { name, description }, db = pool) {
    const setClauses = [];
    const params = [];
    if (name !== undefined) { setClauses.push("name = ?"); params.push(name); }
    if (description !== undefined) { setClauses.push("description = ?"); params.push(description); }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE departments SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM departments WHERE id = ?`, [id]);
}

module.exports = { create, findById, listByConference, update, remove };
