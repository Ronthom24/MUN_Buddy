const pool = require("../config/database");

async function create(
    { conferenceId, committeeId, title, category, description, filePath, visibility, status },
    db = pool
) {
    const [result] = await db.execute(
        `INSERT INTO resources (conference_id, committee_id, title, category, description, file_path, visibility, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            conferenceId, committeeId || null, title, category || "other", description || null,
            filePath || null, visibility || "all", status || "draft"
        ]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM resources WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM resources WHERE conference_id = ? ORDER BY created_at DESC`,
        [conferenceId]
    );
    return rows;
}

const UPDATABLE_FIELDS = {
    title: "title", category: "category", description: "description",
    visibility: "visibility", status: "status"
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
    await db.execute(`UPDATE resources SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM resources WHERE id = ?`, [id]);
}

async function incrementDownloadCount(id, db = pool) {
    await db.execute(`UPDATE resources SET download_count = download_count + 1 WHERE id = ?`, [id]);
}

async function listVisibleToDelegate(conferenceId, { isAssignedAndPublished }, db = pool) {
    const visibleValues = isAssignedAndPublished ? ["all", "assigned"] : ["all"];
    const [rows] = await db.query(
        `SELECT * FROM resources
         WHERE conference_id = ? AND status = 'published' AND visibility IN (?)
         ORDER BY created_at DESC`,
        [conferenceId, visibleValues]
    );
    return rows;
}

module.exports = {
    create, findById, listByConference, update, remove, incrementDownloadCount, listVisibleToDelegate
};
