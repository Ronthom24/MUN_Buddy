const pool = require("../config/database");

async function create({ committeeId, name, type, description, status }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO portfolios (committee_id, name, type, description, status)
         VALUES (?, ?, ?, ?, ?)`,
        [committeeId, name, type || "country", description || null, status || "available"]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM portfolios WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByCommittee(committeeId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM portfolios WHERE committee_id = ? ORDER BY name ASC`,
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
            setClauses.push(`${column} = ?`);
            params.push(data[key]);
        }
    }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE portfolios SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM portfolios WHERE id = ?`, [id]);
}

module.exports = { create, findById, listByCommittee, update, remove };
