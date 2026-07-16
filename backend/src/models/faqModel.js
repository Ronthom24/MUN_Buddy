const pool = require("../config/database");

async function create({ conferenceId, category, question, askedByDelegateId, answer, status }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO faqs (conference_id, category, question, asked_by_delegate_id, answer, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [conferenceId, category || "general", question, askedByDelegateId || null, answer || null, status || "pending"]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM faqs WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, { status, category } = {}, db = pool) {
    const clauses = ["f.conference_id = ?"];
    const params = [conferenceId];
    if (status) {
        clauses.push("f.status = ?");
        params.push(status);
    }
    if (category) {
        clauses.push("f.category = ?");
        params.push(category);
    }

    const [rows] = await db.query(
        `SELECT f.*, d.full_name AS asked_by_name
         FROM faqs f
         LEFT JOIN delegates d ON d.id = f.asked_by_delegate_id
         WHERE ${clauses.join(" AND ")}
         ORDER BY f.is_pinned DESC, f.created_at DESC`,
        params
    );
    return rows;
}

async function listPublished(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT id, category, question, answer, is_pinned, answered_at, created_at
         FROM faqs WHERE conference_id = ? AND status = 'published'
         ORDER BY is_pinned DESC, created_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function answer(id, { answer, status, answeredByAccessId }, db = pool) {
    await db.execute(
        `UPDATE faqs SET answer = ?, status = ?, answered_by_access_id = ?, answered_at = NOW() WHERE id = ?`,
        [answer, status || "answered", answeredByAccessId || null, id]
    );
    return findById(id, db);
}

async function update(id, { category, isPinned, status }, db = pool) {
    const setClauses = [];
    const params = [];
    if (category !== undefined) { setClauses.push("category = ?"); params.push(category); }
    if (isPinned !== undefined) { setClauses.push("is_pinned = ?"); params.push(isPinned); }
    if (status !== undefined) { setClauses.push("status = ?"); params.push(status); }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE faqs SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM faqs WHERE id = ?`, [id]);
}

module.exports = { create, findById, listByConference, listPublished, answer, update, remove };
