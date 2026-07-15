const pool = require("../config/database");

async function create({ delegateId, committeeId, agendaId, type, title, content }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO delegate_documents (delegate_id, committee_id, agenda_id, type, title, content)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [delegateId, committeeId || null, agendaId || null, type, title, content || null]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM delegate_documents WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByDelegate(delegateId, { type } = {}, db = pool) {
    const clauses = ["delegate_id = ?"];
    const params = [delegateId];

    if (type) {
        clauses.push("type = ?");
        params.push(type);
    }

    const [rows] = await db.execute(
        `SELECT * FROM delegate_documents WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC`,
        params
    );
    return rows;
}

async function update(id, { title, content, status }, db = pool) {
    const setClauses = [];
    const params = [];

    if (title !== undefined) { setClauses.push("title = ?"); params.push(title); }
    if (content !== undefined) { setClauses.push("content = ?"); params.push(content); }
    if (status !== undefined) { setClauses.push("status = ?"); params.push(status); }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE delegate_documents SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM delegate_documents WHERE id = ?`, [id]);
}

module.exports = { create, findById, listByDelegate, update, remove };
