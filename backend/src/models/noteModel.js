const pool = require("../config/database");

async function create({ delegateId, title, content, tags }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO notes (delegate_id, title, content, tags) VALUES (?, ?, ?, ?)`,
        [delegateId, title, content || null, tags || null]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM notes WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByDelegate(delegateId, { search, tag } = {}, db = pool) {
    const clauses = ["delegate_id = ?"];
    const params = [delegateId];

    if (search) {
        clauses.push("(title LIKE ? OR content LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }

    if (tag) {
        clauses.push("tags LIKE ?");
        params.push(`%${tag}%`);
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

    if (title !== undefined) { setClauses.push("title = ?"); params.push(title); }
    if (content !== undefined) { setClauses.push("content = ?"); params.push(content); }
    if (tags !== undefined) { setClauses.push("tags = ?"); params.push(tags); }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE notes SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM notes WHERE id = ?`, [id]);
}

module.exports = { create, findById, listByDelegate, update, remove };
