const pool = require("../config/database");

async function create({ conferenceId, category, question, askedByDelegateId, answer, status }, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO faqs (conference_id, category, question, asked_by_delegate_id, answer, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [conferenceId, category || "general", question, askedByDelegateId || null, answer || null, status || "pending"]
    );
    return rows[0].id;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM faqs WHERE id = $1`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, { status, category } = {}, db = pool) {
    const clauses = ["f.conference_id = $1"];
    const params = [conferenceId];
    if (status) {
        clauses.push(`f.status = $${params.length + 1}`);
        params.push(status);
    }
    if (category) {
        clauses.push(`f.category = $${params.length + 1}`);
        params.push(category);
    }

    const [rows] = await db.query(
        `SELECT f.*, pr.full_name AS asked_by_name
         FROM faqs f
         LEFT JOIN delegates d ON d.id = f.asked_by_delegate_id
         LEFT JOIN profiles pr ON pr.id = d.profile_id
         WHERE ${clauses.join(" AND ")}
         ORDER BY f.is_pinned DESC, f.created_at DESC`,
        params
    );
    return rows;
}

async function listPublished(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT id, category, question, answer, is_pinned, answered_at, created_at
         FROM faqs WHERE conference_id = $1 AND status = 'published'
         ORDER BY is_pinned DESC, created_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function answer(id, { answer, status, answeredByAccessId }, db = pool) {
    await db.execute(
        `UPDATE faqs SET answer = $1, status = $2, answered_by_access_id = $3, answered_at = now() WHERE id = $4`,
        [answer, status || "answered", answeredByAccessId || null, id]
    );
    return findById(id, db);
}

async function update(id, { category, isPinned, status }, db = pool) {
    const setClauses = [];
    const params = [];
    let idx = 1;
    if (category !== undefined) { setClauses.push(`category = $${idx++}`); params.push(category); }
    if (isPinned !== undefined) { setClauses.push(`is_pinned = $${idx++}`); params.push(isPinned); }
    if (status !== undefined) { setClauses.push(`status = $${idx++}`); params.push(status); }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE faqs SET ${setClauses.join(", ")} WHERE id = $${idx}`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM faqs WHERE id = $1`, [id]);
}

module.exports = { create, findById, listByConference, listPublished, answer, update, remove };
