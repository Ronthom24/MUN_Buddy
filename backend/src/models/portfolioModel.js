const pool = require("../config/database");

async function create({ committeeId, name, type, description, status }, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO portfolios (committee_id, name, type, description, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [committeeId, name, type || "country", description || null, status || "available"]
    );
    return rows[0].id;
}

/**
 * Used by the country-checklist picker in the committee UI: adding a dozen+
 * countries one at a time each meant a full request round trip (slow enough
 * against the hosted DB to be annoying), so this inserts them all in a
 * single request. There's no unique constraint on (committee_id, name), so
 * dedup against already-existing names happens here rather than via
 * ON CONFLICT, since the picker pre-checks countries already added and the
 * caller may resubmit a selection that overlaps them.
 */
async function bulkCreate(committeeId, names, type, db = pool) {
    const existing = await listByCommittee(committeeId, db);
    const existingNames = new Set(existing.map((p) => p.name.toLowerCase()));
    const toInsert = [...new Set(names)].filter((name) => !existingNames.has(name.toLowerCase()));

    const created = [];
    for (const name of toInsert) {
        const [rows] = await db.execute(
            `INSERT INTO portfolios (committee_id, name, type, status) VALUES ($1, $2, $3, 'available') RETURNING id`,
            [committeeId, name, type || "country"]
        );
        created.push(rows[0].id);
    }
    return created;
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

module.exports = { create, bulkCreate, findById, listByCommittee, update, remove, restore, listTrashedByConference };
