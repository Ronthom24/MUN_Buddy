const pool = require("../config/database");

async function create({ delegateId, title, content, tags }, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO notes (delegate_id, title, content, tags) VALUES ($1, $2, $3, $4) RETURNING id`,
        [delegateId, title, content || null, tags || null]
    );
    return rows[0].id;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM notes WHERE id = $1`, [id]);
    return rows[0] || null;
}

async function listByDelegate(delegateId, { search, tag } = {}, db = pool) {
    const clauses = ["delegate_id = $1"];
    const params = [delegateId];

    if (search) {
        params.push(`%${search}%`, `%${search}%`);
        clauses.push(`(title ILIKE $${params.length - 1} OR content ILIKE $${params.length})`);
    }

    if (tag) {
        params.push(`%${tag}%`);
        clauses.push(`tags ILIKE $${params.length}`);
    }

    const [rows] = await db.execute(
        `SELECT * FROM notes WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC`,
        params
    );
    return rows;
}

async function update(id, { title, content, tags }, db = pool) {
    const setClauses = [];
    const params = [];

    if (title !== undefined) { params.push(title); setClauses.push(`title = $${params.length}`); }
    if (content !== undefined) { params.push(content); setClauses.push(`content = $${params.length}`); }
    if (tags !== undefined) { params.push(tags); setClauses.push(`tags = $${params.length}`); }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE notes SET ${setClauses.join(", ")} WHERE id = $${params.length}`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM notes WHERE id = $1`, [id]);
}

module.exports = { create, findById, listByDelegate, update, remove };
