const pool = require("../config/database");

async function create({ conferenceId, subject, body, audience, committeeId, status, scheduledAt, createdByAccessId }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO email_broadcasts (conference_id, subject, body, audience, committee_id, status, scheduled_at, created_by_access_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            conferenceId, subject, body, audience || "all", committeeId || null,
            status || "draft", scheduledAt || null, createdByAccessId || null
        ]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM email_broadcasts WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT b.*,
                (SELECT COUNT(*) FROM email_broadcast_recipients r WHERE r.broadcast_id = b.id) AS recipient_count,
                (SELECT COUNT(*) FROM email_broadcast_recipients r WHERE r.broadcast_id = b.id AND r.status = 'sent') AS sent_count,
                (SELECT COUNT(*) FROM email_broadcast_recipients r WHERE r.broadcast_id = b.id AND r.status = 'failed') AS failed_count
         FROM email_broadcasts b WHERE b.conference_id = ? ORDER BY b.created_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function updateStatus(id, status, extra = {}, db = pool) {
    const setClauses = ["status = ?"];
    const params = [status];
    if (extra.sentAt !== undefined) { setClauses.push("sent_at = ?"); params.push(extra.sentAt); }

    params.push(id);
    await db.execute(`UPDATE email_broadcasts SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function addRecipients(broadcastId, delegates, db = pool) {
    if (delegates.length === 0) return;
    const values = delegates.map((d) => [broadcastId, d.id, d.email]);
    await db.query(
        `INSERT INTO email_broadcast_recipients (broadcast_id, delegate_id, email) VALUES ?`,
        [values]
    );
}

async function listRecipients(broadcastId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM email_broadcast_recipients WHERE broadcast_id = ? ORDER BY id ASC`,
        [broadcastId]
    );
    return rows;
}

async function markRecipientResult(id, status, errorMessage, db = pool) {
    await db.execute(
        `UPDATE email_broadcast_recipients SET status = ?, sent_at = NOW(), error_message = ? WHERE id = ?`,
        [status, errorMessage || null, id]
    );
}

module.exports = {
    create, findById, listByConference, updateStatus, addRecipients, listRecipients, markRecipientResult
};
