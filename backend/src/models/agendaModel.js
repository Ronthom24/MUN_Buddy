const pool = require("../config/database");

async function create({ committeeId, title, description, backgroundNotes, status, publicationDate }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO agendas (committee_id, title, description, background_notes, status, publication_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [committeeId, title, description || null, backgroundNotes || null, status || "draft", publicationDate || null]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM agendas WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByCommittee(committeeId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM agendas WHERE committee_id = ? ORDER BY created_at DESC`,
        [committeeId]
    );
    return rows;
}

const UPDATABLE_FIELDS = {
    title: "title", description: "description", backgroundNotes: "background_notes",
    status: "status", publicationDate: "publication_date"
};

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
    await db.execute(`UPDATE agendas SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM agendas WHERE id = ?`, [id]);
}

module.exports = { create, findById, listByCommittee, update, remove };
