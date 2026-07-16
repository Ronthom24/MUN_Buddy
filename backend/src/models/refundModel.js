const pool = require("../config/database");

async function create({ paymentId, conferenceId, amount, reason, notes, refundDate, approvedByAccessId }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO refunds (payment_id, conference_id, amount, reason, notes, refund_date, approved_by_organizer_access_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [paymentId, conferenceId, amount, reason, notes || null, refundDate, approvedByAccessId || null]
    );
    return findById(result.insertId, db);
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM refunds WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT r.*, p.delegate_id, d.full_name AS delegate_name
         FROM refunds r
         INNER JOIN payments p ON p.id = r.payment_id
         INNER JOIN delegates d ON d.id = p.delegate_id
         WHERE r.conference_id = ?
         ORDER BY r.created_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function listByPayment(paymentId, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM refunds WHERE payment_id = ? ORDER BY created_at DESC`, [paymentId]);
    return rows;
}

module.exports = { create, findById, listByConference, listByPayment };
