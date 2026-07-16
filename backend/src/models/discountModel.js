const pool = require("../config/database");

async function create({ conferenceId, delegateId, feeCategoryId, type, amount, reason, appliedByAccessId }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO discounts (conference_id, delegate_id, fee_category_id, type, amount, reason, applied_by_organizer_access_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [conferenceId, delegateId, feeCategoryId || null, type, amount, reason, appliedByAccessId || null]
    );
    return findById(result.insertId, db);
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM discounts WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT disc.*, d.full_name AS delegate_name, fc.name AS fee_category_name
         FROM discounts disc
         INNER JOIN delegates d ON d.id = disc.delegate_id
         LEFT JOIN fee_categories fc ON fc.id = disc.fee_category_id
         WHERE disc.conference_id = ?
         ORDER BY disc.created_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function listByDelegate(delegateId, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM discounts WHERE delegate_id = ? ORDER BY created_at DESC`, [delegateId]);
    return rows;
}

async function sumForConference(conferenceId, db = pool) {
    const [[row]] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM discounts WHERE conference_id = ?`,
        [conferenceId]
    );
    return Number(row.total) || 0;
}

module.exports = { create, findById, listByConference, listByDelegate, sumForConference };
