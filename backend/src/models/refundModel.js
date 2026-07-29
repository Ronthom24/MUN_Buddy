const pool = require("../config/database");

async function create({ paymentId, conferenceId, amount, reason, notes, refundDate, approvedByAccessId }, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO refunds (payment_id, conference_id, amount, reason, notes, refund_date, approved_by_organizer_access_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [paymentId, conferenceId, amount, reason, notes || null, refundDate, approvedByAccessId || null]
    );
    return findById(rows[0].id, db);
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM refunds WHERE id = $1`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT r.*, p.delegate_id, pr.full_name AS delegate_name
         FROM refunds r
         INNER JOIN payments p ON p.id = r.payment_id
         INNER JOIN delegates d ON d.id = p.delegate_id
         JOIN profiles pr ON pr.id = d.profile_id
         WHERE r.conference_id = $1
         ORDER BY r.created_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function listByPayment(paymentId, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM refunds WHERE payment_id = $1 ORDER BY created_at DESC`, [paymentId]);
    return rows;
}

module.exports = { create, findById, listByConference, listByPayment };
