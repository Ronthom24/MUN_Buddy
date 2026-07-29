const pool = require("../config/database");

async function create({ conferenceId, subject, body, audience, committeeId, status, scheduledAt, createdByAccessId }, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO email_broadcasts (conference_id, subject, body, audience, committee_id, status, scheduled_at, created_by_access_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
            conferenceId, subject, body, audience || "all", committeeId || null,
            status || "draft", scheduledAt || null, createdByAccessId || null
        ]
    );
    return rows[0].id;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM email_broadcasts WHERE id = $1`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT b.*,
                (SELECT COUNT(*) FROM email_broadcast_recipients r WHERE r.broadcast_id = b.id) AS recipient_count,
                (SELECT COUNT(*) FROM email_broadcast_recipients r WHERE r.broadcast_id = b.id AND r.status = 'sent') AS sent_count,
                (SELECT COUNT(*) FROM email_broadcast_recipients r WHERE r.broadcast_id = b.id AND r.status = 'failed') AS failed_count
         FROM email_broadcasts b WHERE b.conference_id = $1 ORDER BY b.created_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function updateStatus(id, status, extra = {}, db = pool) {
    const setClauses = ["status = $1"];
    const params = [status];
    if (extra.sentAt !== undefined) { params.push(extra.sentAt); setClauses.push(`sent_at = $${params.length}`); }

    params.push(id);
    await db.execute(`UPDATE email_broadcasts SET ${setClauses.join(", ")} WHERE id = $${params.length}`, params);
    return findById(id, db);
}

async function addRecipients(broadcastId, delegates, db = pool) {
    if (delegates.length === 0) return;
    const params = [];
    const placeholders = delegates.map((d) => {
        params.push(broadcastId, d.id, d.email);
        return `($${params.length - 2}, $${params.length - 1}, $${params.length})`;
    });
    await db.query(
        `INSERT INTO email_broadcast_recipients (broadcast_id, delegate_id, email) VALUES ${placeholders.join(", ")}`,
        params
    );
}

async function listRecipients(broadcastId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM email_broadcast_recipients WHERE broadcast_id = $1 ORDER BY id ASC`,
        [broadcastId]
    );
    return rows;
}

async function markRecipientResult(id, status, errorMessage, db = pool) {
    await db.execute(
        `UPDATE email_broadcast_recipients SET status = $1, sent_at = now(), error_message = $2 WHERE id = $3`,
        [status, errorMessage || null, id]
    );
}

module.exports = {
    create, findById, listByConference, updateStatus, addRecipients, listRecipients, markRecipientResult
};
