const pool = require("../config/database");

async function create({ committeeId, name, type, description, status }, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO portfolios (committee_id, name, type, description, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [committeeId, name, type || "country", description || null, status || "available"]
    );
    return rows[0].id;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM portfolios WHERE id = $1 AND deleted_at IS NULL`, [id]);
    return rows[0] || null;
}

async function listByCommittee(committeeId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM portfolios WHERE committee_id = $1 AND deleted_at IS NULL ORDER BY name ASC`,
        [committeeId]
    );
    return rows;
}

const UPDATABLE_FIELDS = { name: "name", type: "type", description: "description", status: "status" };

async function update(id, data, db = pool) {
    const setClauses = [];
    const params = [];

    for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
        if (data[key] !== undefined) {
            params.push(data[key]);
            setClauses.push(`${column} = $${params.length}`);
        }
    }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE portfolios SET ${setClauses.join(", ")} WHERE id = $${params.length}`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`UPDATE portfolios SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
}

async function restore(id, db = pool) {
    await db.execute(`UPDATE portfolios SET deleted_at = NULL WHERE id = $1`, [id]);
    return findById(id, db);
}

async function listTrashedByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT p.*, c.name AS committee_name FROM portfolios p
         INNER JOIN committees c ON c.id = p.committee_id
         WHERE c.conference_id = $1 AND p.deleted_at IS NOT NULL
         ORDER BY p.deleted_at DESC`,
        [conferenceId]
    );
    return rows;
}

module.exports = { create, findById, listByCommittee, update, remove, restore, listTrashedByConference };
