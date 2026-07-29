const pool = require("../config/database");

async function create({ conferenceId, name, chair, viceChair, capacity, type, status }, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO committees (conference_id, name, chair, vice_chair, capacity, type, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [conferenceId, name, chair || null, viceChair || null, capacity || null, type || "standard", status || "open"]
    );
    return rows[0].id;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM committees WHERE id = $1 AND deleted_at IS NULL`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM committees WHERE conference_id = $1 AND deleted_at IS NULL ORDER BY name ASC`,
        [conferenceId]
    );
    return rows;
}

const UPDATABLE_FIELDS = {
    name: "name", chair: "chair", viceChair: "vice_chair", capacity: "capacity",
    type: "type", status: "status"
};

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
    await db.execute(`UPDATE committees SET ${setClauses.join(", ")} WHERE id = $${params.length}`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`UPDATE committees SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
}

async function restore(id, db = pool) {
    await db.execute(`UPDATE committees SET deleted_at = NULL WHERE id = $1`, [id]);
    return findById(id, db);
}

async function listTrashed(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT * FROM committees WHERE conference_id = $1 AND deleted_at IS NOT NULL ORDER BY deleted_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function getStats(committeeId, db = pool) {
    const [[assignedCounts]] = await db.query(
        `SELECT COUNT(*) AS assigned_count FROM assignments WHERE committee_id = $1 AND status = 'assigned'`,
        [committeeId]
    );
    const [[portfolioCounts]] = await db.query(
        `SELECT COUNT(*) AS total_portfolios, COUNT(*) FILTER (WHERE status = 'available') AS available_portfolios
         FROM portfolios WHERE committee_id = $1`,
        [committeeId]
    );
    const [preferenceRows] = await db.query(
        `SELECT COUNT(*) AS preference_count FROM delegate_committee_preferences WHERE committee_id = $1`,
        [committeeId]
    );

    return {
        assignedCount: Number(assignedCounts.assigned_count) || 0,
        totalPortfolios: Number(portfolioCounts.total_portfolios) || 0,
        availablePortfolios: Number(portfolioCounts.available_portfolios) || 0,
        preferenceCount: Number(preferenceRows[0]?.preference_count) || 0
    };
}

module.exports = { create, findById, listByConference, update, remove, getStats, restore, listTrashed };
