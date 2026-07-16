const pool = require("../config/database");

async function create({ conferenceId, name, amount, currency, description, isRequired }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO fee_categories (conference_id, name, amount, currency, description, is_required)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [conferenceId, name, amount, currency || "INR", description || null, isRequired !== false]
    );
    return findById(result.insertId, db);
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM fee_categories WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, { includeArchived = false } = {}, db = pool) {
    const clause = includeArchived ? "" : "AND status = 'active'";
    const [rows] = await db.execute(
        `SELECT * FROM fee_categories WHERE conference_id = ? ${clause} ORDER BY created_at ASC`,
        [conferenceId]
    );
    return rows;
}

const UPDATABLE_FIELDS = { name: "name", amount: "amount", currency: "currency", description: "description", isRequired: "is_required" };

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
    await db.execute(`UPDATE fee_categories SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function archive(id, db = pool) {
    await db.execute(`UPDATE fee_categories SET status = 'archived' WHERE id = ?`, [id]);
    return findById(id, db);
}

async function sumRequiredAmount(conferenceId, db = pool) {
    const [[row]] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM fee_categories WHERE conference_id = ? AND status = 'active' AND is_required = TRUE`,
        [conferenceId]
    );
    return Number(row.total) || 0;
}

module.exports = { create, findById, listByConference, update, archive, sumRequiredAmount };
