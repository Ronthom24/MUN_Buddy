const pool = require("../config/database");

async function create(
    { conferenceId, title, category, targetAudience, priority, content, attachmentPath, publishDate, status },
    db = pool
) {
    const [result] = await db.execute(
        `INSERT INTO announcements
            (conference_id, title, category, target_audience, priority, content, attachment_path, publish_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            conferenceId, title, category || "general_update", targetAudience || "all",
            priority || "normal", content, attachmentPath || null, publishDate || null, status || "draft"
        ]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM announcements WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM announcements WHERE conference_id = ? ORDER BY created_at DESC`,
        [conferenceId]
    );
    return rows;
}

const UPDATABLE_FIELDS = {
    title: "title", category: "category", targetAudience: "target_audience",
    priority: "priority", content: "content", publishDate: "publish_date", status: "status"
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
    await db.execute(`UPDATE announcements SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM announcements WHERE id = ?`, [id]);
}

async function listVisibleToDelegate(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT * FROM announcements
         WHERE conference_id = ? AND status = 'published' AND target_audience IN ('all', 'delegates')
         ORDER BY COALESCE(publish_date, created_at) DESC`,
        [conferenceId]
    );
    return rows;
}

module.exports = { create, findById, listByConference, update, remove, listVisibleToDelegate };
