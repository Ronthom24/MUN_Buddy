const pool = require("../config/database");

async function create(
    { conferenceId, committeeId, portfolioId, title, category, tags, description, filePath, visibility, status },
    db = pool
) {
    const [result] = await db.execute(
        `INSERT INTO resources (conference_id, committee_id, portfolio_id, title, category, tags, description, file_path, visibility, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            conferenceId, committeeId || null, portfolioId || null, title, category || "other", tags || null,
            description || null, filePath || null, visibility || "all", status || "draft"
        ]
    );

    if (filePath) {
        await db.execute(
            `INSERT INTO resource_versions (resource_id, version, file_path) VALUES (?, 1, ?)`,
            [result.insertId, filePath]
        );
    }

    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM resources WHERE id = ? AND deleted_at IS NULL`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, { search, category, tag } = {}, db = pool) {
    const clauses = ["r.conference_id = ?", "r.deleted_at IS NULL"];
    const params = [conferenceId];

    if (search) {
        clauses.push("(r.title LIKE ? OR r.description LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
        clauses.push("r.category = ?");
        params.push(category);
    }
    if (tag) {
        clauses.push("r.tags LIKE ?");
        params.push(`%${tag}%`);
    }

    const [rows] = await db.query(
        `SELECT r.*, c.name AS committee_name, p.name AS portfolio_name
         FROM resources r
         LEFT JOIN committees c ON c.id = r.committee_id
         LEFT JOIN portfolios p ON p.id = r.portfolio_id
         WHERE ${clauses.join(" AND ")}
         ORDER BY r.created_at DESC`,
        params
    );
    return rows;
}

const UPDATABLE_FIELDS = {
    title: "title", category: "category", description: "description", tags: "tags",
    committeeId: "committee_id", portfolioId: "portfolio_id",
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

async function addVersion(resourceId, filePath, uploadedBy, db = pool) {
    const resource = await findById(resourceId, db);
    const nextVersion = (resource.version || 1) + 1;

    await db.execute(
        `INSERT INTO resource_versions (resource_id, version, file_path, uploaded_by) VALUES (?, ?, ?, ?)`,
        [resourceId, nextVersion, filePath, uploadedBy || null]
    );
    await db.execute(`UPDATE resources SET file_path = ?, version = ? WHERE id = ?`, [filePath, nextVersion, resourceId]);
    return findById(resourceId, db);
}

async function listVersions(resourceId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM resource_versions WHERE resource_id = ? ORDER BY version DESC`,
        [resourceId]
    );
    return rows;
}

async function remove(id, db = pool) {
    await db.execute(`UPDATE resources SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
}

async function restore(id, db = pool) {
    await db.execute(`UPDATE resources SET deleted_at = NULL WHERE id = ?`, [id]);
    return findById(id, db);
}

async function listTrashed(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT * FROM resources WHERE conference_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function incrementDownloadCount(id, db = pool) {
    await db.execute(`UPDATE resources SET download_count = download_count + 1 WHERE id = ?`, [id]);
}

async function listVisibleToDelegate(conferenceId, { isAssignedAndPublished, committeeId, portfolioId }, db = pool) {
    const visibleValues = isAssignedAndPublished ? ["all", "assigned"] : ["all"];
    const [rows] = await db.query(
        `SELECT * FROM resources
         WHERE conference_id = ? AND status = 'published' AND deleted_at IS NULL AND visibility IN (?)
           AND (committee_id IS NULL OR committee_id = ?)
           AND (portfolio_id IS NULL OR portfolio_id = ?)
         ORDER BY created_at DESC`,
        [conferenceId, visibleValues, committeeId || null, portfolioId || null]
    );
    return rows;
}

module.exports = {
    create, findById, listByConference, update, remove, incrementDownloadCount, listVisibleToDelegate,
    addVersion, listVersions, restore, listTrashed
};
