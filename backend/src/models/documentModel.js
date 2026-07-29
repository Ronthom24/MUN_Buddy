const pool = require("../config/database");

async function create({ delegateId, committeeId, agendaId, type, title, content }, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO delegate_documents (delegate_id, committee_id, agenda_id, type, title, content)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [delegateId, committeeId || null, agendaId || null, type, title, content || null]
    );
    return rows[0].id;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM delegate_documents WHERE id = $1`, [id]);
    return rows[0] || null;
}

async function listByDelegate(delegateId, { type } = {}, db = pool) {
    const clauses = ["delegate_id = $1"];
    const params = [delegateId];

    if (type) {
        clauses.push(`type = $${params.length + 1}`);
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
    let idx = 1;

    if (title !== undefined) { setClauses.push(`title = $${idx++}`); params.push(title); }
    if (content !== undefined) { setClauses.push(`content = $${idx++}`); params.push(content); }
    if (status !== undefined) { setClauses.push(`status = $${idx++}`); params.push(status); }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE delegate_documents SET ${setClauses.join(", ")} WHERE id = $${idx}`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM delegate_documents WHERE id = $1`, [id]);
}

module.exports = { create, findById, listByDelegate, update, remove };
