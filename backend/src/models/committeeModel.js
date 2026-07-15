const pool = require("../config/database");

async function create({ conferenceId, name, chair, viceChair, capacity, type, status }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO committees (conference_id, name, chair, vice_chair, capacity, type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [conferenceId, name, chair || null, viceChair || null, capacity || null, type || "standard", status || "open"]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM committees WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM committees WHERE conference_id = ? ORDER BY name ASC`,
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
            setClauses.push(`${column} = ?`);
            params.push(data[key]);
        }
    }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE committees SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM committees WHERE id = ?`, [id]);
}

async function getStats(committeeId, db = pool) {
    const [[assignedCounts]] = await db.query(
        `SELECT COUNT(*) AS assigned_count FROM assignments WHERE committee_id = ? AND status = 'assigned'`,
        [committeeId]
    );
    const [[portfolioCounts]] = await db.query(
        `SELECT COUNT(*) AS total_portfolios, SUM(status = 'available') AS available_portfolios
         FROM portfolios WHERE committee_id = ?`,
        [committeeId]
    );
    const [preferenceRows] = await db.query(
        `SELECT COUNT(*) AS preference_count FROM delegate_committee_preferences WHERE committee_id = ?`,
        [committeeId]
    );

    return {
        assignedCount: Number(assignedCounts.assigned_count) || 0,
        totalPortfolios: Number(portfolioCounts.total_portfolios) || 0,
        availablePortfolios: Number(portfolioCounts.available_portfolios) || 0,
        preferenceCount: Number(preferenceRows[0]?.preference_count) || 0
    };
}

module.exports = { create, findById, listByConference, update, remove, getStats };
